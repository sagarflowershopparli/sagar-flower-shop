export const products = [
 {id:'pastel',name:'Pastel garden bouquet',category:'Bouquets',photo:'bouquets/bouquets-25.webp',description:'A garden-inspired bouquet from our portfolio. Share your preferred colours, occasion and budget.',type:'bouquet',position:[-.8,1.01,2.05],colors:[0xe7a8a5,0xf0dfbf,0xd7778c],stop:1},
 {id:'roses',name:'Classic red rose bouquet',category:'Bouquets',photo:'bouquets/bouquets-15.webp',description:'A classic rose bouquet for a thoughtful gift or celebration. Enquire about a custom size.',type:'bouquet',position:[.5,1.01,1.75],colors:[0xb3334b,0x92283c,0xd56270],stop:1},
 {id:'pink',name:'Pink celebration bouquet',category:'Premium arrangements',photo:'bouquets/bouquets-14.webp',description:'Pink floral work from our collection. Ask us to create an arrangement for your occasion.',type:'vase',position:[3.3,1.63,-.7],colors:[0xe69bac,0xeec2c0,0xf4e3cc],stop:3},
 {id:'ivory',name:'Rose & ivory garland',category:'Wedding garlands',photo:'garlands/garlands-04.webp',description:'Traditional wedding garlands with rose and ivory tones. Please book special garlands in advance.',type:'garland',position:[-3.59,1.05,.15],colors:[0xf4e7c8,0xb3354a],stop:2},
 {id:'marigold',name:'Marigold celebration garland',category:'Wedding garlands',photo:'garlands/garlands-06.webp',description:'Festive floral garlands. Share your ceremony date and preferred length for a personal quote.',type:'garland',position:[-3.59,1.05,-1.45],colors:[0xf5b23b,0xe77720],stop:2},
 {id:'fresh',name:'Garden colour bouquet',category:'Fresh flower selection',photo:'bouquets/bouquets-12.webp',description:'Choose a colour palette for a fresh bouquet. Loose flower and stem availability can be confirmed with the shop.',type:'bucket',position:[2.85,.12,2.55],colors:[0xefc263,0xecddd0,0xe2a2ab],stop:3},
 {id:'white',name:'Fresh blooms for your bouquet',category:'Fresh flower selection',photo:'bouquets/bouquets-25.webp',description:'A fresh flower display inspired by our bouquet collection. Ask which flowers are available for your date.',type:'bucket',position:[3.2,.12,1.25],colors:[0xeee8d4,0xf2d7b5],stop:3},
 {id:'wedding',name:'Marigold wedding canopy',category:'Wedding & event décor',photo:'decor/decor-19.webp',description:'A wedding canopy sample inspired by our real decoration work. Send the venue, date and colours to plan your event.',type:'arch',position:[-1.9,.18,-3.35],colors:[0xf3ab35,0xf5cf63,0xe8872d],stop:4},
 {id:'car',name:'Rose wedding car',category:'Car decoration',photo:'decor/decor-42.webp',description:'Explore our actual rose wedding-car decoration in the photograph. Share your vehicle and date to enquire.',type:'car',position:[1.6,.97,-2.8],colors:[0xb63853,0xead9c9],stop:4}
];
export const photoURL=p=>'../assets/images/'+p.photo;
export const orderURL=p=>'https://wa.me/917620644158?text='+encodeURIComponent('Hello Sagar Flower Shop, I saw “'+p.name+'” in your 3D boutique. Please share availability and a quote. My occasion / date: ');
export const stops=[
 {label:'Entrance',title:'Welcome to Sagar.',copy:'Scroll or swipe to step through the glass doors.',position:[0,2.1,11.5],look:[0,1.5,.1]},
 {label:'Bouquets',title:'A bouquet. A beautiful feeling.',copy:'Hand-tied colours, gathered at the heart of our shop.',position:[.1,2.25,4.1],look:[-.2,1.4,1.7]},
 {label:'Garlands',title:'Woven for your forever.',copy:'Traditional garlands, made for a new beginning.',position:[-.65,1.9,-.2],look:[-3.6,1.8,-.65]},
 {label:'Flowers',title:'Freshness, in every stem.',copy:'Seasonal colours and arrangements for your moments.',position:[.75,2.0,.5],look:[3.1,1.5,.6]},
 {label:'Occasions',title:'Imagine your celebration.',copy:'Wedding and car décor, shown here as miniature samples.',position:[.05,2.0,-.65],look:[0,1.35,-3.45]}
];
