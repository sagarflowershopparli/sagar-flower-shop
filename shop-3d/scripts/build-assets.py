"""Build original, reusable glTF flower geometry and small WebP materials. Python + Pillow + numpy."""
from pathlib import Path
import math, json, struct
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'assets'
OUT.mkdir(exist_ok=True)
def rose(low=False):
    vertices=[]; faces=[]
    rings=3 if low else 5
    for ring in range(rings):
        count=(3+ring) if low else (4+ring*2)
        for petal in range(count):
            angle=petal*math.tau/count+ring*2.399
            start=len(vertices); nu=3 if low else 6; nv=2 if low else 4
            r=.16+ring/(rings-1)*.72
            for v in range(nv+1):
                t=v/nv
                for u in range(nu+1):
                    s=u/nu*2-1
                    a=angle+s*(.64 if ring else .9)
                    rad=r*(.4+.6*t)*(.8+.2*math.cos(s*math.pi/2))
                    y=.12+(1-r)*.7+t*.42-math.pow(t,3)*r*.32+math.cos(s*math.pi/2)*.07
                    vertices.append([math.cos(a)*rad,y,math.sin(a)*rad])
            for v in range(nv):
                for u in range(nu):
                    a=start+v*(nu+1)+u; b=a+nu+1
                    faces.extend([[a,b,a+1],[a+1,b,b+1]])
    return vertices,faces

def leaf():
    v=[]; f=[]
    for i in range(7):
        t=i/6
        for side in [-1,0,1]: v.append([math.sin(t*math.pi)*.29*side,t*.17+(0.06 if side==0 else 0),t])
    for i in range(6):
        for j in range(2):
            a=i*3+j; f.extend([[a,a+3,a+1],[a+1,a+3,a+4]])
    return v,f
blob=bytearray(); views=[]; accessors=[]; meshes=[]
def accessor(array,ctype,typ):
    a=np.asarray(array,dtype='<f4' if ctype==5126 else '<u2'); start=len(blob); raw=a.tobytes(); blob.extend(raw)
    while len(blob)%4: blob.append(0)
    views.append({'buffer':0,'byteOffset':start,'byteLength':len(raw)})
    d={'bufferView':len(views)-1,'componentType':ctype,'count':len(a),'type':typ}
    if typ=='VEC3': d.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
    accessors.append(d); return len(accessors)-1
for name,(verts,faces) in [('rose',rose()),('rose_low',rose(True)),('leaf',leaf())]:
    v=np.asarray(verts); normals=np.zeros_like(v)
    for a,b,c in faces:
        n=np.cross(v[b]-v[a],v[c]-v[a]); normals[a]+=n; normals[b]+=n; normals[c]+=n
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
    p=accessor(v,5126,'VEC3'); n=accessor(normals,5126,'VEC3'); idx=accessor(np.asarray(faces).reshape(-1),5123,'SCALAR')
    meshes.append({'name':name,'primitives':[{'attributes':{'POSITION':p,'NORMAL':n},'indices':idx,'material':0}]})
gltf={'asset':{'version':'2.0','generator':'Sagar original botanical asset builder'},'scene':0,'scenes':[{'nodes':list(range(len(meshes)))}],'nodes':[{'mesh':i,'name':m['name']} for i,m in enumerate(meshes)],'meshes':meshes,'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'roughnessFactor':.7,'metallicFactor':0}}],'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
j=json.dumps(gltf,separators=(',',':')).encode(); j+=b' '*((-len(j))%4)
(OUT/'botanical-kit.glb').write_bytes(struct.pack('<III',0x46546C67,2,28+len(j)+len(blob))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(blob),0x004E4942)+blob)
rng=np.random.default_rng(42); y,x=np.mgrid[:512,:512]
for name,base,grain in [('oak',[159,117,76],np.sin(x*.15+np.sin(y*.014)*2)*5+np.sin(x*.8+y*.005)*2),('limestone',[205,194,174],np.sin(x*.016+y*.022)*2)]:
    noise=rng.normal(0,1.8,(512,512)); arr=np.clip(np.array(base)[None,None,:]+(grain+noise)[:,:,None],0,255).astype('uint8'); Image.fromarray(arr).save(OUT/(name+'.webp'),quality=78)
a=(np.maximum(0,1-np.sqrt(((x-256)/256)**2+((y-256)/256)**2))**2*110).astype('uint8')
shadow=np.zeros((512,512,4),dtype='uint8');shadow[:,:,3]=a;Image.fromarray(shadow).resize((128,128)).save(OUT/'contact-shadow.webp')
print('Assets:',[(p.name,p.stat().st_size) for p in OUT.iterdir()])
