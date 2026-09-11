"""Browser regression test. Requires Playwright and Chrome at /opt/google/chrome/chrome."""
from playwright.sync_api import sync_playwright
import json, threading, http.server, functools, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ARTIFACTS=Path(tempfile.mkdtemp(prefix="sagar-shop-check-"))
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/opt/google/chrome/chrome',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 errors=[];bad=[]
 def monitor(page):
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page=browser.new_page(viewport={'width':1200,'height':850},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(60000);monitor(page)
 req=[];page.on('request',lambda r:req.append(r.url))
 page.goto(BASE+'/shop-3d/');assert not any('/vendor/' in r for r in req),'3D downloaded before entry'
 page.locator('#enter').click();page.wait_for_function('window.sagarShopDiagnostics');page.screenshot(path=str(ARTIFACTS/'sagar-entrance3.png'))
 page.get_by_role('button',name='Bouquets',exact=True).click();page.wait_for_timeout(400)
 page.mouse.move(410,430);page.wait_for_timeout(300);assert page.locator('#product-panel').is_visible(),'hover failed'
 page.mouse.click(410,430);page.wait_for_timeout(400);assert page.evaluate('window.sagarShopDiagnostics.selected'),'selection failed'
 page.locator('#details').click();assert page.locator('#details-dialog').is_visible();assert '917620644158' in page.locator('#detail-order').get_attribute('href');page.keyboard.press('Escape');assert not page.locator('#details-dialog').is_visible()
 page.screenshot(path=str(ARTIFACTS/'sagar-product.png'));page.locator('#close-product').click()
 for label in ['Garlands','Flowers','Occasions']:
  page.get_by_role('button',name=label,exact=True).click();page.wait_for_timeout(400);print(label,page.evaluate('window.sagarShopDiagnostics'),flush=True)
 page.get_by_role('button',name='Bouquets',exact=True).click();page.wait_for_timeout(300);page.screenshot(path=str(ARTIFACTS/'sagar-final-desktop.png'))
 page.locator('#browse').click();assert page.locator('#catalog article').count()==9;page.locator('#return-tour').click();assert page.locator('#next').is_visible()
 page.locator('#quality').click();page.wait_for_function("window.sagarShopDiagnostics.quality==='light'");assert page.evaluate('window.sagarShopDiagnostics.quality')=='light'
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce');mobile.set_default_timeout(60000);monitor(mobile)
 mobile.goto(BASE+'/shop-3d/');mobile.locator('#enter').tap();mobile.wait_for_function('window.sagarShopDiagnostics');mobile.get_by_role('button',name='Bouquets',exact=True).tap();mobile.wait_for_timeout(400);mobile.screenshot(path=str(ARTIFACTS/'sagar-mobile.png'));print('MOBILE',mobile.evaluate('window.sagarShopDiagnostics'),flush=True)
 assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
 mobile.touchscreen.tap(138,410);mobile.wait_for_timeout(300);print('MOBILE TAP',mobile.evaluate('window.sagarShopDiagnostics'),flush=True);assert mobile.evaluate('window.sagarShopDiagnostics.selected');mobile.screenshot(path=str(ARTIFACTS/'sagar-mobile-selection.png'))
 mobile.locator('#browse').tap();mobile.locator('#catalog article button').first.tap();assert mobile.locator('#details-dialog').is_visible();mobile.screenshot(path=str(ARTIFACTS/'sagar-mobile-details.png'));mobile.locator('#close-details').tap()
 # Wheel and keyboard navigation, real WebGL context loss, and Save-Data fallback.
 page.mouse.move(600,620);page.mouse.wheel(0,1000);page.wait_for_timeout(500);assert page.evaluate('window.sagarShopDiagnostics.progress')>1
 page.locator('body').click(position={'x':1190,'y':420});page.keyboard.press('End');page.wait_for_function('window.sagarShopDiagnostics.stop===4')
 mobile.locator('#return-tour').tap();mobile.evaluate("document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");mobile.locator('#catalog').wait_for(state='visible');assert 'paused' in mobile.locator('#fallback-message').inner_text()
 saved=browser.new_page();saved.add_init_script("Object.defineProperty(navigator,'connection',{value:{saveData:true}})");saved.goto(BASE+'/shop-3d/');saved.locator('#enter').click();assert saved.locator('#catalog').is_visible();assert saved.locator('canvas').count()==0
 # Failure of a required asset must reveal the real collection.
 failure=browser.new_page();monitor(failure);failure.route('**/botanical-kit.glb',lambda route:route.abort());failure.goto(BASE+'/shop-3d/');failure.locator('#enter').click();failure.locator('#catalog').wait_for(state='visible');assert failure.locator('#catalog article a').count()==9
 # Main website still contains its original gallery, and loads no WebGL runtime.
 home=browser.new_page();home.route('**/*.mp4',lambda route:route.abort());home_req=[];home.on('request',lambda r:home_req.append(r.url));home.goto(BASE+'/',wait_until='domcontentloaded');assert home.locator('.sagar-shop-invitation a').get_attribute('href')=='shop-3d/';assert home.locator('#collection').count()==1;assert not any('/vendor/' in r or '.glb' in r for r in home_req)
 print('ERRORS',errors,'HTTP FAILURES',bad,flush=True);assert not errors;assert not bad;print('ALL CHECKS PASSED',flush=True)
 browser.close()
 server.shutdown()
 print('Screenshots:',ARTIFACTS)
