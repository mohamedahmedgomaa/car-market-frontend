import{_ as Qt}from"./_plugin-vue_export-helper-DlAUqK2U.js";import{b as Gt,V as Xt}from"./VCard-BBd_ZR0i.js";import{r as gt,k as F,w as It,f as St,e as j,b as S,d as B,V as L,ab as et,n as D,t as nt,c as Y,h as Pt,aR as Zt,o as H,a7 as te}from"./index-CVeqPo6e.js";import{V as ee}from"./VCardText-kCYf-WH2.js";import{V as ne}from"./VDialog-DYb7tCAl.js";const oe="/images/logo-black.png";var X={},re=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Mt={},_={};let Bt;const ie=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];_.getSymbolSize=function(t){if(!t)throw new Error('"version" cannot be null or undefined');if(t<1||t>40)throw new Error('"version" should be in range from 1 to 40');return t*4+17};_.getSymbolTotalCodewords=function(t){return ie[t]};_.getBCHDigit=function(e){let t=0;for(;e!==0;)t++,e>>>=1;return t};_.setToSJISFunction=function(t){if(typeof t!="function")throw new Error('"toSJISFunc" is not a valid function.');Bt=t};_.isKanjiModeEnabled=function(){return typeof Bt<"u"};_.toSJIS=function(t){return Bt(t)};var at={};(function(e){e.L={bit:1},e.M={bit:0},e.Q={bit:3},e.H={bit:2};function t(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"l":case"low":return e.L;case"m":case"medium":return e.M;case"q":case"quartile":return e.Q;case"h":case"high":return e.H;default:throw new Error("Unknown EC Level: "+o)}}e.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},e.from=function(r,n){if(e.isValid(r))return r;try{return t(r)}catch{return n}}})(at);function Lt(){this.buffer=[],this.length=0}Lt.prototype={get:function(e){const t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)===1},put:function(e,t){for(let o=0;o<t;o++)this.putBit((e>>>t-o-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(e){const t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}};var se=Lt;function Z(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}Z.prototype.set=function(e,t,o,r){const n=e*this.size+t;this.data[n]=o,r&&(this.reservedBit[n]=!0)};Z.prototype.get=function(e,t){return this.data[e*this.size+t]};Z.prototype.xor=function(e,t,o){this.data[e*this.size+t]^=o};Z.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]};var ae=Z,Dt={};(function(e){const t=_.getSymbolSize;e.getRowColCoords=function(r){if(r===1)return[];const n=Math.floor(r/7)+2,i=t(r),s=i===145?26:Math.ceil((i-13)/(2*n-2))*2,l=[i-7];for(let a=1;a<n-1;a++)l[a]=l[a-1]-s;return l.push(6),l.reverse()},e.getPositions=function(r){const n=[],i=e.getRowColCoords(r),s=i.length;for(let l=0;l<s;l++)for(let a=0;a<s;a++)l===0&&a===0||l===0&&a===s-1||l===s-1&&a===0||n.push([i[l],i[a]]);return n}})(Dt);var Ut={};const le=_.getSymbolSize,kt=7;Ut.getPositions=function(t){const o=le(t);return[[0,0],[o-kt,0],[0,o-kt]]};var zt={};(function(e){e.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const t={N1:3,N2:3,N3:40,N4:10};e.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},e.from=function(n){return e.isValid(n)?parseInt(n,10):void 0},e.getPenaltyN1=function(n){const i=n.size;let s=0,l=0,a=0,g=null,u=null;for(let E=0;E<i;E++){l=a=0,g=u=null;for(let p=0;p<i;p++){let h=n.get(E,p);h===g?l++:(l>=5&&(s+=t.N1+(l-5)),g=h,l=1),h=n.get(p,E),h===u?a++:(a>=5&&(s+=t.N1+(a-5)),u=h,a=1)}l>=5&&(s+=t.N1+(l-5)),a>=5&&(s+=t.N1+(a-5))}return s},e.getPenaltyN2=function(n){const i=n.size;let s=0;for(let l=0;l<i-1;l++)for(let a=0;a<i-1;a++){const g=n.get(l,a)+n.get(l,a+1)+n.get(l+1,a)+n.get(l+1,a+1);(g===4||g===0)&&s++}return s*t.N2},e.getPenaltyN3=function(n){const i=n.size;let s=0,l=0,a=0;for(let g=0;g<i;g++){l=a=0;for(let u=0;u<i;u++)l=l<<1&2047|n.get(g,u),u>=10&&(l===1488||l===93)&&s++,a=a<<1&2047|n.get(u,g),u>=10&&(a===1488||a===93)&&s++}return s*t.N3},e.getPenaltyN4=function(n){let i=0;const s=n.data.length;for(let a=0;a<s;a++)i+=n.data[a];return Math.abs(Math.ceil(i*100/s/5)-10)*t.N4};function o(r,n,i){switch(r){case e.Patterns.PATTERN000:return(n+i)%2===0;case e.Patterns.PATTERN001:return n%2===0;case e.Patterns.PATTERN010:return i%3===0;case e.Patterns.PATTERN011:return(n+i)%3===0;case e.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(i/3))%2===0;case e.Patterns.PATTERN101:return n*i%2+n*i%3===0;case e.Patterns.PATTERN110:return(n*i%2+n*i%3)%2===0;case e.Patterns.PATTERN111:return(n*i%3+(n+i)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}e.applyMask=function(n,i){const s=i.size;for(let l=0;l<s;l++)for(let a=0;a<s;a++)i.isReserved(a,l)||i.xor(a,l,o(n,a,l))},e.getBestMask=function(n,i){const s=Object.keys(e.Patterns).length;let l=0,a=1/0;for(let g=0;g<s;g++){i(g),e.applyMask(g,n);const u=e.getPenaltyN1(n)+e.getPenaltyN2(n)+e.getPenaltyN3(n)+e.getPenaltyN4(n);e.applyMask(g,n),u<a&&(a=u,l=g)}return l}})(zt);var lt={};const U=at,ot=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],rt=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];lt.getBlocksCount=function(t,o){switch(o){case U.L:return ot[(t-1)*4+0];case U.M:return ot[(t-1)*4+1];case U.Q:return ot[(t-1)*4+2];case U.H:return ot[(t-1)*4+3];default:return}};lt.getTotalCodewordsCount=function(t,o){switch(o){case U.L:return rt[(t-1)*4+0];case U.M:return rt[(t-1)*4+1];case U.Q:return rt[(t-1)*4+2];case U.H:return rt[(t-1)*4+3];default:return}};var Vt={},ct={};const Q=new Uint8Array(512),it=new Uint8Array(256);(function(){let t=1;for(let o=0;o<255;o++)Q[o]=t,it[t]=o,t<<=1,t&256&&(t^=285);for(let o=255;o<512;o++)Q[o]=Q[o-255]})();ct.log=function(t){if(t<1)throw new Error("log("+t+")");return it[t]};ct.exp=function(t){return Q[t]};ct.mul=function(t,o){return t===0||o===0?0:Q[it[t]+it[o]]};(function(e){const t=ct;e.mul=function(r,n){const i=new Uint8Array(r.length+n.length-1);for(let s=0;s<r.length;s++)for(let l=0;l<n.length;l++)i[s+l]^=t.mul(r[s],n[l]);return i},e.mod=function(r,n){let i=new Uint8Array(r);for(;i.length-n.length>=0;){const s=i[0];for(let a=0;a<n.length;a++)i[a]^=t.mul(n[a],s);let l=0;for(;l<i.length&&i[l]===0;)l++;i=i.slice(l)}return i},e.generateECPolynomial=function(r){let n=new Uint8Array([1]);for(let i=0;i<r;i++)n=e.mul(n,new Uint8Array([1,t.exp(i)]));return n}})(Vt);const Ft=Vt;function Tt(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}Tt.prototype.initialize=function(t){this.degree=t,this.genPoly=Ft.generateECPolynomial(this.degree)};Tt.prototype.encode=function(t){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(t.length+this.degree);o.set(t);const r=Ft.mod(o,this.genPoly),n=this.degree-r.length;if(n>0){const i=new Uint8Array(this.degree);return i.set(r,n),i}return r};var ce=Tt,jt={},z={},vt={};vt.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40};var M={};const Ht="[0-9]+",de="[A-Z $%*+\\-./:]+";let G="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";G=G.replace(/u/g,"\\u");const fe="(?:(?![A-Z0-9 $%*+\\-./:]|"+G+`)(?:.|[\r
]))+`;M.KANJI=new RegExp(G,"g");M.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");M.BYTE=new RegExp(fe,"g");M.NUMERIC=new RegExp(Ht,"g");M.ALPHANUMERIC=new RegExp(de,"g");const ue=new RegExp("^"+G+"$"),ge=new RegExp("^"+Ht+"$"),he=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");M.testKanji=function(t){return ue.test(t)};M.testNumeric=function(t){return ge.test(t)};M.testAlphanumeric=function(t){return he.test(t)};(function(e){const t=vt,o=M;e.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},e.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},e.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},e.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},e.MIXED={bit:-1},e.getCharCountIndicator=function(i,s){if(!i.ccBits)throw new Error("Invalid mode: "+i);if(!t.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?i.ccBits[0]:s<27?i.ccBits[1]:i.ccBits[2]},e.getBestModeForData=function(i){return o.testNumeric(i)?e.NUMERIC:o.testAlphanumeric(i)?e.ALPHANUMERIC:o.testKanji(i)?e.KANJI:e.BYTE},e.toString=function(i){if(i&&i.id)return i.id;throw new Error("Invalid mode")},e.isValid=function(i){return i&&i.bit&&i.ccBits};function r(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return e.NUMERIC;case"alphanumeric":return e.ALPHANUMERIC;case"kanji":return e.KANJI;case"byte":return e.BYTE;default:throw new Error("Unknown mode: "+n)}}e.from=function(i,s){if(e.isValid(i))return i;try{return r(i)}catch{return s}}})(z);(function(e){const t=_,o=lt,r=at,n=z,i=vt,s=7973,l=t.getBCHDigit(s);function a(p,h,b){for(let y=1;y<=40;y++)if(h<=e.getCapacity(y,b,p))return y}function g(p,h){return n.getCharCountIndicator(p,h)+4}function u(p,h){let b=0;return p.forEach(function(y){const N=g(y.mode,h);b+=N+y.getBitsLength()}),b}function E(p,h){for(let b=1;b<=40;b++)if(u(p,b)<=e.getCapacity(b,h,n.MIXED))return b}e.from=function(h,b){return i.isValid(h)?parseInt(h,10):b},e.getCapacity=function(h,b,y){if(!i.isValid(h))throw new Error("Invalid QR Code version");typeof y>"u"&&(y=n.BYTE);const N=t.getSymbolTotalCodewords(h),w=o.getTotalCodewordsCount(h,b),x=(N-w)*8;if(y===n.MIXED)return x;const d=x-g(y,h);switch(y){case n.NUMERIC:return Math.floor(d/10*3);case n.ALPHANUMERIC:return Math.floor(d/11*2);case n.KANJI:return Math.floor(d/13);case n.BYTE:default:return Math.floor(d/8)}},e.getBestVersionForData=function(h,b){let y;const N=r.from(b,r.M);if(Array.isArray(h)){if(h.length>1)return E(h,N);if(h.length===0)return 1;y=h[0]}else y=h;return a(y.mode,y.getLength(),N)},e.getEncodedBits=function(h){if(!i.isValid(h)||h<7)throw new Error("Invalid QR Code version");let b=h<<12;for(;t.getBCHDigit(b)-l>=0;)b^=s<<t.getBCHDigit(b)-l;return h<<12|b}})(jt);var $t={};const yt=_,qt=1335,me=21522,_t=yt.getBCHDigit(qt);$t.getEncodedBits=function(t,o){const r=t.bit<<3|o;let n=r<<10;for(;yt.getBCHDigit(n)-_t>=0;)n^=qt<<yt.getBCHDigit(n)-_t;return(r<<10|n)^me};var Kt={};const pe=z;function $(e){this.mode=pe.NUMERIC,this.data=e.toString()}$.getBitsLength=function(t){return 10*Math.floor(t/3)+(t%3?t%3*3+1:0)};$.prototype.getLength=function(){return this.data.length};$.prototype.getBitsLength=function(){return $.getBitsLength(this.data.length)};$.prototype.write=function(t){let o,r,n;for(o=0;o+3<=this.data.length;o+=3)r=this.data.substr(o,3),n=parseInt(r,10),t.put(n,10);const i=this.data.length-o;i>0&&(r=this.data.substr(o),n=parseInt(r,10),t.put(n,i*3+1))};var we=$;const be=z,ht=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function q(e){this.mode=be.ALPHANUMERIC,this.data=e}q.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)};q.prototype.getLength=function(){return this.data.length};q.prototype.getBitsLength=function(){return q.getBitsLength(this.data.length)};q.prototype.write=function(t){let o;for(o=0;o+2<=this.data.length;o+=2){let r=ht.indexOf(this.data[o])*45;r+=ht.indexOf(this.data[o+1]),t.put(r,11)}this.data.length%2&&t.put(ht.indexOf(this.data[o]),6)};var ye=q;const xe=z;function K(e){this.mode=xe.BYTE,typeof e=="string"?this.data=new TextEncoder().encode(e):this.data=new Uint8Array(e)}K.getBitsLength=function(t){return t*8};K.prototype.getLength=function(){return this.data.length};K.prototype.getBitsLength=function(){return K.getBitsLength(this.data.length)};K.prototype.write=function(e){for(let t=0,o=this.data.length;t<o;t++)e.put(this.data[t],8)};var Ce=K;const Ee=z,Be=_;function O(e){this.mode=Ee.KANJI,this.data=e}O.getBitsLength=function(t){return t*13};O.prototype.getLength=function(){return this.data.length};O.prototype.getBitsLength=function(){return O.getBitsLength(this.data.length)};O.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let o=Be.toSJIS(this.data[t]);if(o>=33088&&o<=40956)o-=33088;else if(o>=57408&&o<=60351)o-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);o=(o>>>8&255)*192+(o&255),e.put(o,13)}};var Te=O,Ot={exports:{}};(function(e){var t={single_source_shortest_paths:function(o,r,n){var i={},s={};s[r]=0;var l=t.PriorityQueue.make();l.push(r,0);for(var a,g,u,E,p,h,b,y,N;!l.empty();){a=l.pop(),g=a.value,E=a.cost,p=o[g]||{};for(u in p)p.hasOwnProperty(u)&&(h=p[u],b=E+h,y=s[u],N=typeof s[u]>"u",(N||y>b)&&(s[u]=b,l.push(u,b),i[u]=g))}if(typeof n<"u"&&typeof s[n]>"u"){var w=["Could not find a path from ",r," to ",n,"."].join("");throw new Error(w)}return i},extract_shortest_path_from_predecessor_list:function(o,r){for(var n=[],i=r;i;)n.push(i),o[i],i=o[i];return n.reverse(),n},find_path:function(o,r,n){var i=t.single_source_shortest_paths(o,r,n);return t.extract_shortest_path_from_predecessor_list(i,n)},PriorityQueue:{make:function(o){var r=t.PriorityQueue,n={},i;o=o||{};for(i in r)r.hasOwnProperty(i)&&(n[i]=r[i]);return n.queue=[],n.sorter=o.sorter||r.default_sorter,n},default_sorter:function(o,r){return o.cost-r.cost},push:function(o,r){var n={value:o,cost:r};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};e.exports=t})(Ot);var ve=Ot.exports;(function(e){const t=z,o=we,r=ye,n=Ce,i=Te,s=M,l=_,a=ve;function g(w){return unescape(encodeURIComponent(w)).length}function u(w,x,d){const f=[];let m;for(;(m=w.exec(d))!==null;)f.push({data:m[0],index:m.index,mode:x,length:m[0].length});return f}function E(w){const x=u(s.NUMERIC,t.NUMERIC,w),d=u(s.ALPHANUMERIC,t.ALPHANUMERIC,w);let f,m;return l.isKanjiModeEnabled()?(f=u(s.BYTE,t.BYTE,w),m=u(s.KANJI,t.KANJI,w)):(f=u(s.BYTE_KANJI,t.BYTE,w),m=[]),x.concat(d,f,m).sort(function(C,T){return C.index-T.index}).map(function(C){return{data:C.data,mode:C.mode,length:C.length}})}function p(w,x){switch(x){case t.NUMERIC:return o.getBitsLength(w);case t.ALPHANUMERIC:return r.getBitsLength(w);case t.KANJI:return i.getBitsLength(w);case t.BYTE:return n.getBitsLength(w)}}function h(w){return w.reduce(function(x,d){const f=x.length-1>=0?x[x.length-1]:null;return f&&f.mode===d.mode?(x[x.length-1].data+=d.data,x):(x.push(d),x)},[])}function b(w){const x=[];for(let d=0;d<w.length;d++){const f=w[d];switch(f.mode){case t.NUMERIC:x.push([f,{data:f.data,mode:t.ALPHANUMERIC,length:f.length},{data:f.data,mode:t.BYTE,length:f.length}]);break;case t.ALPHANUMERIC:x.push([f,{data:f.data,mode:t.BYTE,length:f.length}]);break;case t.KANJI:x.push([f,{data:f.data,mode:t.BYTE,length:g(f.data)}]);break;case t.BYTE:x.push([{data:f.data,mode:t.BYTE,length:g(f.data)}])}}return x}function y(w,x){const d={},f={start:{}};let m=["start"];for(let c=0;c<w.length;c++){const C=w[c],T=[];for(let P=0;P<C.length;P++){const A=C[P],v=""+c+P;T.push(v),d[v]={node:A,lastCount:0},f[v]={};for(let V=0;V<m.length;V++){const R=m[V];d[R]&&d[R].node.mode===A.mode?(f[R][v]=p(d[R].lastCount+A.length,A.mode)-p(d[R].lastCount,A.mode),d[R].lastCount+=A.length):(d[R]&&(d[R].lastCount=A.length),f[R][v]=p(A.length,A.mode)+4+t.getCharCountIndicator(A.mode,x))}}m=T}for(let c=0;c<m.length;c++)f[m[c]].end=0;return{map:f,table:d}}function N(w,x){let d;const f=t.getBestModeForData(w);if(d=t.from(x,f),d!==t.BYTE&&d.bit<f.bit)throw new Error('"'+w+'" cannot be encoded with mode '+t.toString(d)+`.
 Suggested mode is: `+t.toString(f));switch(d===t.KANJI&&!l.isKanjiModeEnabled()&&(d=t.BYTE),d){case t.NUMERIC:return new o(w);case t.ALPHANUMERIC:return new r(w);case t.KANJI:return new i(w);case t.BYTE:return new n(w)}}e.fromArray=function(x){return x.reduce(function(d,f){return typeof f=="string"?d.push(N(f,null)):f.data&&d.push(N(f.data,f.mode)),d},[])},e.fromString=function(x,d){const f=E(x,l.isKanjiModeEnabled()),m=b(f),c=y(m,d),C=a.find_path(c.map,"start","end"),T=[];for(let P=1;P<C.length-1;P++)T.push(c.table[C[P]].node);return e.fromArray(h(T))},e.rawSplit=function(x){return e.fromArray(E(x,l.isKanjiModeEnabled()))}})(Kt);const dt=_,mt=at,Ne=se,Ae=ae,Ie=Dt,Se=Ut,xt=zt,Ct=lt,Pe=ce,st=jt,ke=$t,_e=z,pt=Kt;function Re(e,t){const o=e.size,r=Se.getPositions(t);for(let n=0;n<r.length;n++){const i=r[n][0],s=r[n][1];for(let l=-1;l<=7;l++)if(!(i+l<=-1||o<=i+l))for(let a=-1;a<=7;a++)s+a<=-1||o<=s+a||(l>=0&&l<=6&&(a===0||a===6)||a>=0&&a<=6&&(l===0||l===6)||l>=2&&l<=4&&a>=2&&a<=4?e.set(i+l,s+a,!0,!0):e.set(i+l,s+a,!1,!0))}}function Me(e){const t=e.size;for(let o=8;o<t-8;o++){const r=o%2===0;e.set(o,6,r,!0),e.set(6,o,r,!0)}}function Le(e,t){const o=Ie.getPositions(t);for(let r=0;r<o.length;r++){const n=o[r][0],i=o[r][1];for(let s=-2;s<=2;s++)for(let l=-2;l<=2;l++)s===-2||s===2||l===-2||l===2||s===0&&l===0?e.set(n+s,i+l,!0,!0):e.set(n+s,i+l,!1,!0)}}function De(e,t){const o=e.size,r=st.getEncodedBits(t);let n,i,s;for(let l=0;l<18;l++)n=Math.floor(l/3),i=l%3+o-8-3,s=(r>>l&1)===1,e.set(n,i,s,!0),e.set(i,n,s,!0)}function wt(e,t,o){const r=e.size,n=ke.getEncodedBits(t,o);let i,s;for(i=0;i<15;i++)s=(n>>i&1)===1,i<6?e.set(i,8,s,!0):i<8?e.set(i+1,8,s,!0):e.set(r-15+i,8,s,!0),i<8?e.set(8,r-i-1,s,!0):i<9?e.set(8,15-i-1+1,s,!0):e.set(8,15-i-1,s,!0);e.set(r-8,8,1,!0)}function Ue(e,t){const o=e.size;let r=-1,n=o-1,i=7,s=0;for(let l=o-1;l>0;l-=2)for(l===6&&l--;;){for(let a=0;a<2;a++)if(!e.isReserved(n,l-a)){let g=!1;s<t.length&&(g=(t[s]>>>i&1)===1),e.set(n,l-a,g),i--,i===-1&&(s++,i=7)}if(n+=r,n<0||o<=n){n-=r,r=-r;break}}}function ze(e,t,o){const r=new Ne;o.forEach(function(a){r.put(a.mode.bit,4),r.put(a.getLength(),_e.getCharCountIndicator(a.mode,e)),a.write(r)});const n=dt.getSymbolTotalCodewords(e),i=Ct.getTotalCodewordsCount(e,t),s=(n-i)*8;for(r.getLengthInBits()+4<=s&&r.put(0,4);r.getLengthInBits()%8!==0;)r.putBit(0);const l=(s-r.getLengthInBits())/8;for(let a=0;a<l;a++)r.put(a%2?17:236,8);return Ve(r,e,t)}function Ve(e,t,o){const r=dt.getSymbolTotalCodewords(t),n=Ct.getTotalCodewordsCount(t,o),i=r-n,s=Ct.getBlocksCount(t,o),l=r%s,a=s-l,g=Math.floor(r/s),u=Math.floor(i/s),E=u+1,p=g-u,h=new Pe(p);let b=0;const y=new Array(s),N=new Array(s);let w=0;const x=new Uint8Array(e.buffer);for(let C=0;C<s;C++){const T=C<a?u:E;y[C]=x.slice(b,b+T),N[C]=h.encode(y[C]),b+=T,w=Math.max(w,T)}const d=new Uint8Array(r);let f=0,m,c;for(m=0;m<w;m++)for(c=0;c<s;c++)m<y[c].length&&(d[f++]=y[c][m]);for(m=0;m<p;m++)for(c=0;c<s;c++)d[f++]=N[c][m];return d}function Fe(e,t,o,r){let n;if(Array.isArray(e))n=pt.fromArray(e);else if(typeof e=="string"){let g=t;if(!g){const u=pt.rawSplit(e);g=st.getBestVersionForData(u,o)}n=pt.fromString(e,g||40)}else throw new Error("Invalid data");const i=st.getBestVersionForData(n,o);if(!i)throw new Error("The amount of data is too big to be stored in a QR Code");if(!t)t=i;else if(t<i)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+i+`.
`);const s=ze(t,o,n),l=dt.getSymbolSize(t),a=new Ae(l);return Re(a,t),Me(a),Le(a,t),wt(a,o,0),t>=7&&De(a,t),Ue(a,s),isNaN(r)&&(r=xt.getBestMask(a,wt.bind(null,a,o))),xt.applyMask(r,a),wt(a,o,r),{modules:a,version:t,errorCorrectionLevel:o,maskPattern:r,segments:n}}Mt.create=function(t,o){if(typeof t>"u"||t==="")throw new Error("No input text");let r=mt.M,n,i;return typeof o<"u"&&(r=mt.from(o.errorCorrectionLevel,mt.M),n=st.from(o.version),i=xt.from(o.maskPattern),o.toSJISFunc&&dt.setToSJISFunction(o.toSJISFunc)),Fe(t,n,r,i)};var Jt={},Nt={};(function(e){function t(o){if(typeof o=="number"&&(o=o.toString()),typeof o!="string")throw new Error("Color should be defined as hex string");let r=o.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+o);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(i){return[i,i]}))),r.length===6&&r.push("F","F");const n=parseInt(r.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+r.slice(0,6).join("")}}e.getOptions=function(r){r||(r={}),r.color||(r.color={});const n=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,i=r.width&&r.width>=21?r.width:void 0,s=r.scale||4;return{width:i,scale:i?4:s,margin:n,color:{dark:t(r.color.dark||"#000000ff"),light:t(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},e.getScale=function(r,n){return n.width&&n.width>=r+n.margin*2?n.width/(r+n.margin*2):n.scale},e.getImageWidth=function(r,n){const i=e.getScale(r,n);return Math.floor((r+n.margin*2)*i)},e.qrToImageData=function(r,n,i){const s=n.modules.size,l=n.modules.data,a=e.getScale(s,i),g=Math.floor((s+i.margin*2)*a),u=i.margin*a,E=[i.color.light,i.color.dark];for(let p=0;p<g;p++)for(let h=0;h<g;h++){let b=(p*g+h)*4,y=i.color.light;if(p>=u&&h>=u&&p<g-u&&h<g-u){const N=Math.floor((p-u)/a),w=Math.floor((h-u)/a);y=E[l[N*s+w]?1:0]}r[b++]=y.r,r[b++]=y.g,r[b++]=y.b,r[b]=y.a}}})(Nt);(function(e){const t=Nt;function o(n,i,s){n.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=s,i.width=s,i.style.height=s+"px",i.style.width=s+"px"}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}e.render=function(i,s,l){let a=l,g=s;typeof a>"u"&&(!s||!s.getContext)&&(a=s,s=void 0),s||(g=r()),a=t.getOptions(a);const u=t.getImageWidth(i.modules.size,a),E=g.getContext("2d"),p=E.createImageData(u,u);return t.qrToImageData(p.data,i,a),o(E,g,u),E.putImageData(p,0,0),g},e.renderToDataURL=function(i,s,l){let a=l;typeof a>"u"&&(!s||!s.getContext)&&(a=s,s=void 0),a||(a={});const g=e.render(i,s,a),u=a.type||"image/png",E=a.rendererOpts||{};return g.toDataURL(u,E.quality)}})(Jt);var Wt={};const je=Nt;function Rt(e,t){const o=e.a/255,r=t+'="'+e.hex+'"';return o<1?r+" "+t+'-opacity="'+o.toFixed(2).slice(1)+'"':r}function bt(e,t,o){let r=e+t;return typeof o<"u"&&(r+=" "+o),r}function He(e,t,o){let r="",n=0,i=!1,s=0;for(let l=0;l<e.length;l++){const a=Math.floor(l%t),g=Math.floor(l/t);!a&&!i&&(i=!0),e[l]?(s++,l>0&&a>0&&e[l-1]||(r+=i?bt("M",a+o,.5+g+o):bt("m",n,0),n=0,i=!1),a+1<t&&e[l+1]||(r+=bt("h",s),s=0)):n++}return r}Wt.render=function(t,o,r){const n=je.getOptions(o),i=t.modules.size,s=t.modules.data,l=i+n.margin*2,a=n.color.light.a?"<path "+Rt(n.color.light,"fill")+' d="M0 0h'+l+"v"+l+'H0z"/>':"",g="<path "+Rt(n.color.dark,"stroke")+' d="'+He(s,i,n.margin)+'"/>',u='viewBox="0 0 '+l+" "+l+'"',p='<svg xmlns="http://www.w3.org/2000/svg" '+(n.width?'width="'+n.width+'" height="'+n.width+'" ':"")+u+' shape-rendering="crispEdges">'+a+g+`</svg>
`;return typeof r=="function"&&r(null,p),p};const $e=re,Et=Mt,Yt=Jt,qe=Wt;function At(e,t,o,r,n){const i=[].slice.call(arguments,1),s=i.length,l=typeof i[s-1]=="function";if(!l&&!$e())throw new Error("Callback required as last argument");if(l){if(s<2)throw new Error("Too few arguments provided");s===2?(n=o,o=t,t=r=void 0):s===3&&(t.getContext&&typeof n>"u"?(n=r,r=void 0):(n=r,r=o,o=t,t=void 0))}else{if(s<1)throw new Error("Too few arguments provided");return s===1?(o=t,t=r=void 0):s===2&&!t.getContext&&(r=o,o=t,t=void 0),new Promise(function(a,g){try{const u=Et.create(o,r);a(e(u,t,r))}catch(u){g(u)}})}try{const a=Et.create(o,r);n(null,e(a,t,r))}catch(a){n(a)}}X.create=Et.create;X.toCanvas=At.bind(null,Yt.render);X.toDataURL=At.bind(null,Yt.renderToDataURL);X.toString=At.bind(null,function(e,t,o){return qe.render(e,o)});const Ke={class:"d-flex align-center gap-3"},Oe={class:"qr-header-icon-box rounded-xl p-2 bg-primary-subtle text-primary"},Je={class:"px-4 py-3 bg-slate-900/60 d-flex justify-space-between align-center flex-wrap gap-2 no-print border-b flex-shrink-0"},We={class:"d-flex gap-2"},Ye={class:"text-xs text-amber-400 font-medium d-flex align-center gap-1"},Qe={id:"printable-car-flyer",class:"car-flyer-poster p-5 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl max-w-[480px] mx-auto text-center"},Ge={class:"flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-200"},Xe={class:"text-left"},Ze={class:"text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-300"},tn={key:0,class:"flex items-center justify-between bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 dir-ltr"},en={class:"flex items-center gap-2.5"},nn=["src"],on={class:"text-base font-black text-slate-900"},rn={key:0,class:"text-xs font-bold text-slate-800 flex items-center gap-1"},sn={class:"bg-slate-100 border-2 border-slate-200 text-slate-900 rounded-xl p-3.5 mb-3.5 text-center shadow-sm"},an={class:"text-lg font-black text-slate-900 m-0 leading-snug dir-ltr"},ln={class:"flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center"},cn={class:"relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-3 flex items-center justify-center",style:{width:"220px !important",height:"220px !important",margin:"0 auto !important"}},dn=["src"],fn={key:1,class:"w-48 h-48 flex items-center justify-center text-slate-400"},un={class:"text-xs font-black text-slate-800 m-0 flex items-center gap-1.5 justify-center"},gn={__name:"CarQrDialog",props:{isDialogVisible:{type:Boolean,required:!0},car:{type:Object,default:()=>null}},emits:["update:isDialogVisible"],setup(e,{emit:t}){const o=e,r=t,n=gt(""),i=gt(!1),s=gt(!1),l=F(()=>{var d;return(d=o.car)!=null&&d.id?`${window.location.origin}/user/cars/${o.car.id}`:""}),a=F(()=>{var f,m,c;if(!((f=o.car)!=null&&f.brand))return"";const d=o.car.brand;return typeof d=="string"?d:((m=d.name)==null?void 0:m.en)||((c=d.name)==null?void 0:c.ar)||d.name||""}),g=F(()=>{var f,m,c;if(!((f=o.car)!=null&&f.model))return"";const d=o.car.model;return typeof d=="string"?d:((m=d.name)==null?void 0:m.en)||((c=d.name)==null?void 0:c.ar)||d.name||""}),u=F(()=>{var d;return o.car?typeof o.car.title=="object"&&((d=o.car.title)!=null&&d.en)?o.car.title.en:typeof o.car.title=="string"&&o.car.title?o.car.title:`${a.value} ${g.value}`.trim():""}),E=F(()=>{var f,m,c;if(!((f=o.car)!=null&&f.seller))return"";const d=o.car.seller;return typeof d.store_name=="object"&&d.store_name?((m=d.store_name)==null?void 0:m.ar)||((c=d.store_name)==null?void 0:c.en)||d.name||"":d.store_name||d.name||""}),p=F(()=>{var d;return(d=o.car)!=null&&d.seller&&(o.car.seller.store_logo||o.car.seller.logo)||""}),h=F(()=>{var d,f,m,c;return((f=(d=o.car)==null?void 0:d.seller)==null?void 0:f.phone)||((m=o.car)==null?void 0:m.phone_number)||((c=o.car)==null?void 0:c.phone)||""}),b=async()=>{if(l.value){i.value=!0;try{n.value=await X.toDataURL(l.value,{width:700,margin:2,color:{dark:"#0f172a",light:"#ffffff"},errorCorrectionLevel:"H"})}catch(d){console.error("Failed to generate QR Code:",d)}finally{i.value=!1}}};It(()=>o.isDialogVisible,d=>{d&&o.car&&te(()=>{b()})},{immediate:!0}),It(()=>o.car,d=>{d&&o.isDialogVisible&&b()});const y=()=>{r("update:isDialogVisible",!1)},N=()=>{var P;const d=document.createElement("iframe");d.style.position="fixed",d.style.left="0",d.style.top="0",d.style.width="1000px",d.style.height="1400px",d.style.opacity="0",d.style.pointerEvents="none",d.style.zIndex="-1",document.body.appendChild(d);const f=d.contentWindow.document;f.open(),f.write(`
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
      <meta charset="utf-8">
      <title>NegmCars.com - ${u.value}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          height: 100%;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          direction: ltr;
        }
        .print-container {
          box-sizing: border-box;
          width: 100%;
          height: 260mm;
          max-height: 260mm;
          margin: 0 auto !important;
          padding: 20px 24px;
          border: 4px solid #0f172a;
          border-radius: 24px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          box-shadow: none;
          page-break-inside: avoid !important;
          page-break-before: avoid !important;
          page-break-after: avoid !important;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 3px solid #e2e8f0;
        }
        .brand-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-logo-img {
          height: 38px;
          max-height: 38px;
          width: auto;
          object-fit: contain;
          border-radius: 6px;
        }
        .brand-text {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .brand-cars {
          color: #f97316;
        }
        .car-id {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 5px 16px;
          border-radius: 18px;
          border: 2px solid #cbd5e1;
        }
        .showroom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fffbe6;
          border: 2px solid #fde047;
          border-radius: 16px;
          padding: 10px 16px;
          margin-bottom: 14px;
          direction: ltr;
        }
        .showroom-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .showroom-logo {
          width: 36px !important;
          height: 36px !important;
          max-width: 36px !important;
          max-height: 36px !important;
          object-fit: contain !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          flex-shrink: 0 !important;
        }
        .showroom-icon {
          font-size: 22px;
        }
        .showroom-name {
          font-size: 17px;
          font-weight: 900;
          color: #0f172a;
        }
        .showroom-phone {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          direction: ltr;
        }
        .title-box {
          margin-bottom: 14px;
          padding: 16px;
          background-color: #f8fafc;
          border: 2px solid #cbd5e1;
          border-radius: 20px;
          color: #0f172a;
        }
        .car-title-en {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.3;
          margin: 0;
          text-align: center;
        }
        .qr-card {
          background-color: #f8fafc;
          border: 3px dashed #cbd5e1;
          border-radius: 24px;
          padding: 22px 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .qr-image-wrapper {
          background-color: #ffffff;
          padding: 14px;
          border-radius: 20px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          margin-bottom: 14px;
        }
        .qr-image {
          width: 270px;
          height: 270px;
          display: block;
          object-fit: contain;
        }
        .qr-hint {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          direction: rtl;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- 1. Header: NegmCars.com Logo & Orange Brand Name & ID -->
        <div class="header-row">
          <div class="brand-box">
            <img src="/images/logo-black.png" alt="NegmCars" class="brand-logo-img" />
            <h2 class="brand-text">Negm<span class="brand-cars">Cars</span>.com</h2>
          </div>
          <div class="car-id">ID: #${((P=o.car)==null?void 0:P.id)||""}</div>
        </div>

        ${E.value?`
        <!-- Showroom Info Bar (Left to Right) -->
        <div class="showroom-bar">
          <div class="showroom-info">
            ${p.value?`<img src="${p.value}" class="showroom-logo" alt="Showroom Logo" />`:'<span class="showroom-icon">🏪</span>'}
            <span class="showroom-name">${E.value}</span>
          </div>
          ${h.value?`<div class="showroom-phone">📞 ${h.value}</div>`:""}
        </div>
        `:""}

        <!-- 2. English Title ONLY (Light Background with Black Text) -->
        <div class="title-box">
          <h1 class="car-title-en">${u.value}</h1>
        </div>

        <!-- 3. CENTER: Large QR Code -->
        <div class="qr-card">
          <div class="qr-image-wrapper">
            <img src="${n.value}" class="qr-image" alt="Car QR Code" />
          </div>
          <p class="qr-hint">لرؤية التفاصيل والسعر استخدم qr</p>
        </div>
      </div>
    </body>
    </html>
  `),f.close();const m=f.querySelectorAll("img");let c=0;const C=m.length,T=()=>{setTimeout(()=>{d.contentWindow.focus(),d.contentWindow.print(),setTimeout(()=>{document.body.contains(d)&&document.body.removeChild(d)},2e3)},200)};C===0?T():(m.forEach(A=>{A.complete&&A.naturalWidth!==0?(c++,c===C&&T()):A.onload=A.onerror=()=>{c++,c===C&&T()}}),setTimeout(()=>{c<C&&T()},1200))},w=async()=>{var d,f;s.value=!0;try{const m=document.createElement("canvas");m.width=1200,m.height=1600;const c=m.getContext("2d");c.fillStyle="#ffffff",c.fillRect(0,0,1200,1600),c.strokeStyle="#0f172a",c.lineWidth=14,c.beginPath(),c.roundRect(30,30,1140,1540,32),c.stroke(),c.strokeStyle="#e2e8f0",c.lineWidth=4,c.beginPath(),c.moveTo(60,160),c.lineTo(1140,160),c.stroke();const C=new Image;C.crossOrigin="anonymous",C.src="/images/logo-black.png",await new Promise(k=>{C.onload=k,C.onerror=k});let T=60;if(C.complete&&C.naturalWidth){const I=C.naturalWidth/C.naturalHeight*64;c.drawImage(C,60,60,I,64),T=60+I+20}c.textAlign="left",c.font="bold 44px system-ui, sans-serif",c.fillStyle="#0f172a",c.fillText("Negm",T,108);const P=c.measureText("Negm").width;c.fillStyle="#f97316",c.fillText("Cars",T+P,108);const A=c.measureText("Cars").width;c.fillStyle="#0f172a",c.fillText(".com",T+P+A,108),c.fillStyle="#f1f5f9",c.beginPath(),c.roundRect(940,65,200,60,30),c.fill(),c.strokeStyle="#cbd5e1",c.lineWidth=3,c.stroke(),c.fillStyle="#0f172a",c.font="bold 28px system-ui, sans-serif",c.textAlign="center",c.fillText(`ID: #${((d=o.car)==null?void 0:d.id)||""}`,1040,106);let v=190;if(E.value){c.fillStyle="#fffbe6",c.beginPath(),c.roundRect(60,v,1080,95,20),c.fill(),c.strokeStyle="#fde047",c.lineWidth=3,c.stroke();let k=90;if(p.value){const I=new Image;if(I.crossOrigin="anonymous",I.src=p.value,await new Promise(W=>{I.onload=W,I.onerror=W}),I.complete&&I.naturalWidth){let tt=60,ft=60;const ut=I.naturalWidth/I.naturalHeight;ut>1?ft=60/ut:tt=60*ut,c.drawImage(I,90,v+17.5+(60-ft)/2,tt,ft),k=170}}c.direction="ltr",c.textAlign="left",c.fillStyle="#0f172a",c.font="bold 32px system-ui, sans-serif",c.fillText(E.value,k,v+58),h.value&&(c.direction="ltr",c.textAlign="right",c.fillStyle="#1e293b",c.font="bold 26px system-ui, sans-serif",c.fillText(`📞 ${h.value}`,1110,v+58)),v+=115}c.fillStyle="#f8fafc",c.beginPath(),c.roundRect(60,v,1080,180,28),c.fill(),c.strokeStyle="#cbd5e1",c.lineWidth=3,c.stroke(),c.direction="ltr",c.fillStyle="#0f172a",c.font="bold 38px system-ui, sans-serif",c.textAlign="center";const V=u.value;if(V.length>45){const k=V.split(" "),I=Math.ceil(k.length/2),W=k.slice(0,I).join(" "),tt=k.slice(I).join(" ");c.fillText(W,600,v+70),c.fillText(tt,600,v+135)}else c.fillText(V,600,v+105);v+=200;const R=1530-v;if(c.fillStyle="#f8fafc",c.beginPath(),c.roundRect(60,v,1080,R,32),c.fill(),c.strokeStyle="#cbd5e1",c.lineWidth=4,c.stroke(),n.value){const k=new Image;k.src=n.value,await new Promise(I=>{k.onload=I}),c.fillStyle="#ffffff",c.beginPath(),c.roundRect(260,v+50,680,680,32),c.fill(),c.strokeStyle="#e2e8f0",c.lineWidth=4,c.stroke(),c.drawImage(k,290,v+80,620,620)}c.direction="rtl",c.fillStyle="#0f172a",c.font="bold 36px system-ui, sans-serif",c.textAlign="center",c.fillText("لرؤية التفاصيل والسعر استخدم qr",600,v+800);const J=document.createElement("a");J.href=m.toDataURL("image/png"),J.download=`NegmCars-Poster-${((f=o.car)==null?void 0:f.id)||"car"}.png`,document.body.appendChild(J),J.click(),document.body.removeChild(J)}catch(m){console.error("Failed to generate poster image:",m)}finally{s.value=!1}},x=()=>{var f;if(!n.value)return;const d=document.createElement("a");d.href=n.value,d.download=`car-qr-${((f=o.car)==null?void 0:f.id)||"poster"}.png`,document.body.appendChild(d),d.click(),document.body.removeChild(d)};return(d,f)=>(H(),St(ne,{"model-value":e.isDialogVisible,"max-width":"640",scrollable:"","onUpdate:modelValue":y},{default:j(()=>[S(Xt,{class:"qr-dialog-card rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-h-[92vh] flex flex-col"},{default:j(()=>[S(Gt,{class:"d-flex align-center justify-space-between pa-4 bg-surface text-foreground no-print border-b flex-shrink-0"},{default:j(()=>[B("div",Ke,[B("div",Oe,[S(L,{icon:"tabler-qrcode",size:"26"})]),f[0]||(f[0]=B("div",null,[B("h3",{class:"text-base font-bold m-0"},"بطاقة QR Code للسيارة - NegmCars.com"),B("p",{class:"text-xs opacity-75 m-0"},"جاهزة للطباعة وتحميل الصورة على ورقة A4 كاملة")],-1))]),S(et,{icon:"tabler-x",variant:"text",density:"comfortable",onClick:y})]),_:1}),B("div",Je,[B("div",We,[S(et,{color:"primary",size:"small",class:"font-bold rounded-lg shadow",onClick:N},{default:j(()=>[S(L,{icon:"tabler-printer",class:"me-1.5"}),f[1]||(f[1]=D(" طباعة الورقة (Print A4) "))]),_:1}),S(et,{color:"success",size:"small",class:"font-bold rounded-lg shadow",loading:s.value,onClick:w},{default:j(()=>[S(L,{icon:"tabler-photo-down",class:"me-1.5"}),f[2]||(f[2]=D(" تحميل الورقة كـ صورة (PNG) "))]),_:1},8,["loading"]),S(et,{color:"secondary",variant:"outlined",size:"small",class:"font-bold rounded-lg",onClick:x},{default:j(()=>[S(L,{icon:"tabler-download",class:"me-1.5"}),f[3]||(f[3]=D(" QR فقط "))]),_:1})]),B("span",Ye,[S(L,{icon:"tabler-info-circle",size:"15"}),f[4]||(f[4]=D(" طباعة صفحة A4 واحدة "))])]),S(ee,{class:"pa-4 printable-wrapper overflow-y-auto flex-grow max-h-[calc(88vh-110px)]"},{default:j(()=>{var m;return[B("div",Qe,[B("div",Ge,[f[5]||(f[5]=B("div",{class:"flex items-center gap-2.5"},[B("img",{src:oe,alt:"NegmCars",style:{height:"34px !important",width:"auto !important","max-height":"34px !important","max-width":"120px !important","object-fit":"contain !important",display:"inline-block !important"},class:"rounded-md flex-shrink-0"}),B("span",{class:"text-xl font-black tracking-tight text-slate-900 leading-none"},[D(" Negm"),B("span",{class:"text-amber-500"},"Cars"),D(".com ")])],-1)),B("div",Xe,[B("span",Ze,"ID: #"+nt((m=e.car)==null?void 0:m.id),1)])]),E.value?(H(),Y("div",tn,[B("div",en,[p.value?(H(),Y("img",{key:0,src:p.value,alt:"Showroom Logo",style:{width:"34px !important",height:"34px !important","max-width":"34px !important","max-height":"34px !important","object-fit":"contain !important","border-radius":"8px !important","flex-shrink":"0 !important"},class:"bg-white border border-amber-300"},null,8,nn)):(H(),St(L,{key:1,icon:"tabler-building-store",size:"22",class:"text-amber-700"})),B("span",on,nt(E.value),1)]),h.value?(H(),Y("div",rn,[S(L,{icon:"tabler-phone",size:"14",class:"text-amber-700"}),D(" "+nt(h.value),1)])):Pt("",!0)])):Pt("",!0),B("div",sn,[B("h1",an,nt(u.value),1)]),B("div",ln,[B("div",cn,[n.value?(H(),Y("img",{key:0,src:n.value,alt:"Car QR Code",style:{width:"194px !important",height:"194px !important","max-width":"194px !important","max-height":"194px !important","object-fit":"contain !important",display:"block !important",margin:"0 auto !important"}},null,8,dn)):(H(),Y("div",fn,[S(Zt,{indeterminate:"",color:"primary"})]))]),B("p",un,[S(L,{icon:"tabler-scan",size:"16",class:"text-amber-600"}),f[6]||(f[6]=D(" لرؤية التفاصيل والسعر استخدم qr "))])])])]}),_:1})]),_:1})]),_:1},8,["model-value"]))}},yn=Qt(gn,[["__scopeId","data-v-f5034b2e"]]);export{yn as C};
