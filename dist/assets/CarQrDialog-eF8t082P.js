import{_ as Yt}from"./_plugin-vue_export-helper-DlAUqK2U.js";import{b as Qt,V as Gt}from"./VCard-_jADe9Wo.js";import{r as ut,k as V,w as St,f as At,e as j,b as k,d as v,V as L,ab as tt,n as D,t as et,c as W,h as Nt,aR as Xt,o as H,a7 as Zt}from"./index-BfG7FnLw.js";import{V as te}from"./VCardText-J_UpAYRO.js";import{V as ee}from"./VDialog-C-5DnOPB.js";const ne="/images/logo-black.png";var G={},oe=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Rt={},_={};let Et;const re=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];_.getSymbolSize=function(t){if(!t)throw new Error('"version" cannot be null or undefined');if(t<1||t>40)throw new Error('"version" should be in range from 1 to 40');return t*4+17};_.getSymbolTotalCodewords=function(t){return re[t]};_.getBCHDigit=function(e){let t=0;for(;e!==0;)t++,e>>>=1;return t};_.setToSJISFunction=function(t){if(typeof t!="function")throw new Error('"toSJISFunc" is not a valid function.');Et=t};_.isKanjiModeEnabled=function(){return typeof Et<"u"};_.toSJIS=function(t){return Et(t)};var st={};(function(e){e.L={bit:1},e.M={bit:0},e.Q={bit:3},e.H={bit:2};function t(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"l":case"low":return e.L;case"m":case"medium":return e.M;case"q":case"quartile":return e.Q;case"h":case"high":return e.H;default:throw new Error("Unknown EC Level: "+o)}}e.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},e.from=function(r,n){if(e.isValid(r))return r;try{return t(r)}catch{return n}}})(st);function Mt(){this.buffer=[],this.length=0}Mt.prototype={get:function(e){const t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)===1},put:function(e,t){for(let o=0;o<t;o++)this.putBit((e>>>t-o-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(e){const t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}};var ie=Mt;function X(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}X.prototype.set=function(e,t,o,r){const n=e*this.size+t;this.data[n]=o,r&&(this.reservedBit[n]=!0)};X.prototype.get=function(e,t){return this.data[e*this.size+t]};X.prototype.xor=function(e,t,o){this.data[e*this.size+t]^=o};X.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]};var se=X,Lt={};(function(e){const t=_.getSymbolSize;e.getRowColCoords=function(r){if(r===1)return[];const n=Math.floor(r/7)+2,i=t(r),s=i===145?26:Math.ceil((i-13)/(2*n-2))*2,c=[i-7];for(let a=1;a<n-1;a++)c[a]=c[a-1]-s;return c.push(6),c.reverse()},e.getPositions=function(r){const n=[],i=e.getRowColCoords(r),s=i.length;for(let c=0;c<s;c++)for(let a=0;a<s;a++)c===0&&a===0||c===0&&a===s-1||c===s-1&&a===0||n.push([i[c],i[a]]);return n}})(Lt);var Dt={};const ae=_.getSymbolSize,Pt=7;Dt.getPositions=function(t){const o=ae(t);return[[0,0],[o-Pt,0],[0,o-Pt]]};var Ut={};(function(e){e.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const t={N1:3,N2:3,N3:40,N4:10};e.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},e.from=function(n){return e.isValid(n)?parseInt(n,10):void 0},e.getPenaltyN1=function(n){const i=n.size;let s=0,c=0,a=0,g=null,u=null;for(let E=0;E<i;E++){c=a=0,g=u=null;for(let p=0;p<i;p++){let h=n.get(E,p);h===g?c++:(c>=5&&(s+=t.N1+(c-5)),g=h,c=1),h=n.get(p,E),h===u?a++:(a>=5&&(s+=t.N1+(a-5)),u=h,a=1)}c>=5&&(s+=t.N1+(c-5)),a>=5&&(s+=t.N1+(a-5))}return s},e.getPenaltyN2=function(n){const i=n.size;let s=0;for(let c=0;c<i-1;c++)for(let a=0;a<i-1;a++){const g=n.get(c,a)+n.get(c,a+1)+n.get(c+1,a)+n.get(c+1,a+1);(g===4||g===0)&&s++}return s*t.N2},e.getPenaltyN3=function(n){const i=n.size;let s=0,c=0,a=0;for(let g=0;g<i;g++){c=a=0;for(let u=0;u<i;u++)c=c<<1&2047|n.get(g,u),u>=10&&(c===1488||c===93)&&s++,a=a<<1&2047|n.get(u,g),u>=10&&(a===1488||a===93)&&s++}return s*t.N3},e.getPenaltyN4=function(n){let i=0;const s=n.data.length;for(let a=0;a<s;a++)i+=n.data[a];return Math.abs(Math.ceil(i*100/s/5)-10)*t.N4};function o(r,n,i){switch(r){case e.Patterns.PATTERN000:return(n+i)%2===0;case e.Patterns.PATTERN001:return n%2===0;case e.Patterns.PATTERN010:return i%3===0;case e.Patterns.PATTERN011:return(n+i)%3===0;case e.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(i/3))%2===0;case e.Patterns.PATTERN101:return n*i%2+n*i%3===0;case e.Patterns.PATTERN110:return(n*i%2+n*i%3)%2===0;case e.Patterns.PATTERN111:return(n*i%3+(n+i)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}e.applyMask=function(n,i){const s=i.size;for(let c=0;c<s;c++)for(let a=0;a<s;a++)i.isReserved(a,c)||i.xor(a,c,o(n,a,c))},e.getBestMask=function(n,i){const s=Object.keys(e.Patterns).length;let c=0,a=1/0;for(let g=0;g<s;g++){i(g),e.applyMask(g,n);const u=e.getPenaltyN1(n)+e.getPenaltyN2(n)+e.getPenaltyN3(n)+e.getPenaltyN4(n);e.applyMask(g,n),u<a&&(a=u,c=g)}return c}})(Ut);var at={};const U=st,nt=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],ot=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];at.getBlocksCount=function(t,o){switch(o){case U.L:return nt[(t-1)*4+0];case U.M:return nt[(t-1)*4+1];case U.Q:return nt[(t-1)*4+2];case U.H:return nt[(t-1)*4+3];default:return}};at.getTotalCodewordsCount=function(t,o){switch(o){case U.L:return ot[(t-1)*4+0];case U.M:return ot[(t-1)*4+1];case U.Q:return ot[(t-1)*4+2];case U.H:return ot[(t-1)*4+3];default:return}};var zt={},lt={};const Y=new Uint8Array(512),rt=new Uint8Array(256);(function(){let t=1;for(let o=0;o<255;o++)Y[o]=t,rt[t]=o,t<<=1,t&256&&(t^=285);for(let o=255;o<512;o++)Y[o]=Y[o-255]})();lt.log=function(t){if(t<1)throw new Error("log("+t+")");return rt[t]};lt.exp=function(t){return Y[t]};lt.mul=function(t,o){return t===0||o===0?0:Y[rt[t]+rt[o]]};(function(e){const t=lt;e.mul=function(r,n){const i=new Uint8Array(r.length+n.length-1);for(let s=0;s<r.length;s++)for(let c=0;c<n.length;c++)i[s+c]^=t.mul(r[s],n[c]);return i},e.mod=function(r,n){let i=new Uint8Array(r);for(;i.length-n.length>=0;){const s=i[0];for(let a=0;a<n.length;a++)i[a]^=t.mul(n[a],s);let c=0;for(;c<i.length&&i[c]===0;)c++;i=i.slice(c)}return i},e.generateECPolynomial=function(r){let n=new Uint8Array([1]);for(let i=0;i<r;i++)n=e.mul(n,new Uint8Array([1,t.exp(i)]));return n}})(zt);const Ft=zt;function Bt(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}Bt.prototype.initialize=function(t){this.degree=t,this.genPoly=Ft.generateECPolynomial(this.degree)};Bt.prototype.encode=function(t){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(t.length+this.degree);o.set(t);const r=Ft.mod(o,this.genPoly),n=this.degree-r.length;if(n>0){const i=new Uint8Array(this.degree);return i.set(r,n),i}return r};var le=Bt,Vt={},z={},Tt={};Tt.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40};var M={};const jt="[0-9]+",ce="[A-Z $%*+\\-./:]+";let Q="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";Q=Q.replace(/u/g,"\\u");const de="(?:(?![A-Z0-9 $%*+\\-./:]|"+Q+`)(?:.|[\r
]))+`;M.KANJI=new RegExp(Q,"g");M.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");M.BYTE=new RegExp(de,"g");M.NUMERIC=new RegExp(jt,"g");M.ALPHANUMERIC=new RegExp(ce,"g");const fe=new RegExp("^"+Q+"$"),ue=new RegExp("^"+jt+"$"),ge=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");M.testKanji=function(t){return fe.test(t)};M.testNumeric=function(t){return ue.test(t)};M.testAlphanumeric=function(t){return ge.test(t)};(function(e){const t=Tt,o=M;e.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},e.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},e.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},e.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},e.MIXED={bit:-1},e.getCharCountIndicator=function(i,s){if(!i.ccBits)throw new Error("Invalid mode: "+i);if(!t.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?i.ccBits[0]:s<27?i.ccBits[1]:i.ccBits[2]},e.getBestModeForData=function(i){return o.testNumeric(i)?e.NUMERIC:o.testAlphanumeric(i)?e.ALPHANUMERIC:o.testKanji(i)?e.KANJI:e.BYTE},e.toString=function(i){if(i&&i.id)return i.id;throw new Error("Invalid mode")},e.isValid=function(i){return i&&i.bit&&i.ccBits};function r(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return e.NUMERIC;case"alphanumeric":return e.ALPHANUMERIC;case"kanji":return e.KANJI;case"byte":return e.BYTE;default:throw new Error("Unknown mode: "+n)}}e.from=function(i,s){if(e.isValid(i))return i;try{return r(i)}catch{return s}}})(z);(function(e){const t=_,o=at,r=st,n=z,i=Tt,s=7973,c=t.getBCHDigit(s);function a(p,h,y){for(let x=1;x<=40;x++)if(h<=e.getCapacity(x,y,p))return x}function g(p,h){return n.getCharCountIndicator(p,h)+4}function u(p,h){let y=0;return p.forEach(function(x){const S=g(x.mode,h);y+=S+x.getBitsLength()}),y}function E(p,h){for(let y=1;y<=40;y++)if(u(p,y)<=e.getCapacity(y,h,n.MIXED))return y}e.from=function(h,y){return i.isValid(h)?parseInt(h,10):y},e.getCapacity=function(h,y,x){if(!i.isValid(h))throw new Error("Invalid QR Code version");typeof x>"u"&&(x=n.BYTE);const S=t.getSymbolTotalCodewords(h),b=o.getTotalCodewordsCount(h,y),C=(S-b)*8;if(x===n.MIXED)return C;const w=C-g(x,h);switch(x){case n.NUMERIC:return Math.floor(w/10*3);case n.ALPHANUMERIC:return Math.floor(w/11*2);case n.KANJI:return Math.floor(w/13);case n.BYTE:default:return Math.floor(w/8)}},e.getBestVersionForData=function(h,y){let x;const S=r.from(y,r.M);if(Array.isArray(h)){if(h.length>1)return E(h,S);if(h.length===0)return 1;x=h[0]}else x=h;return a(x.mode,x.getLength(),S)},e.getEncodedBits=function(h){if(!i.isValid(h)||h<7)throw new Error("Invalid QR Code version");let y=h<<12;for(;t.getBCHDigit(y)-c>=0;)y^=s<<t.getBCHDigit(y)-c;return h<<12|y}})(Vt);var Ht={};const bt=_,$t=1335,he=21522,kt=bt.getBCHDigit($t);Ht.getEncodedBits=function(t,o){const r=t.bit<<3|o;let n=r<<10;for(;bt.getBCHDigit(n)-kt>=0;)n^=$t<<bt.getBCHDigit(n)-kt;return(r<<10|n)^he};var Ot={};const me=z;function $(e){this.mode=me.NUMERIC,this.data=e.toString()}$.getBitsLength=function(t){return 10*Math.floor(t/3)+(t%3?t%3*3+1:0)};$.prototype.getLength=function(){return this.data.length};$.prototype.getBitsLength=function(){return $.getBitsLength(this.data.length)};$.prototype.write=function(t){let o,r,n;for(o=0;o+3<=this.data.length;o+=3)r=this.data.substr(o,3),n=parseInt(r,10),t.put(n,10);const i=this.data.length-o;i>0&&(r=this.data.substr(o),n=parseInt(r,10),t.put(n,i*3+1))};var pe=$;const we=z,gt=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function O(e){this.mode=we.ALPHANUMERIC,this.data=e}O.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)};O.prototype.getLength=function(){return this.data.length};O.prototype.getBitsLength=function(){return O.getBitsLength(this.data.length)};O.prototype.write=function(t){let o;for(o=0;o+2<=this.data.length;o+=2){let r=gt.indexOf(this.data[o])*45;r+=gt.indexOf(this.data[o+1]),t.put(r,11)}this.data.length%2&&t.put(gt.indexOf(this.data[o]),6)};var be=O;const ye=z;function q(e){this.mode=ye.BYTE,typeof e=="string"?this.data=new TextEncoder().encode(e):this.data=new Uint8Array(e)}q.getBitsLength=function(t){return t*8};q.prototype.getLength=function(){return this.data.length};q.prototype.getBitsLength=function(){return q.getBitsLength(this.data.length)};q.prototype.write=function(e){for(let t=0,o=this.data.length;t<o;t++)e.put(this.data[t],8)};var xe=q;const Ce=z,Ee=_;function K(e){this.mode=Ce.KANJI,this.data=e}K.getBitsLength=function(t){return t*13};K.prototype.getLength=function(){return this.data.length};K.prototype.getBitsLength=function(){return K.getBitsLength(this.data.length)};K.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let o=Ee.toSJIS(this.data[t]);if(o>=33088&&o<=40956)o-=33088;else if(o>=57408&&o<=60351)o-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);o=(o>>>8&255)*192+(o&255),e.put(o,13)}};var Be=K,qt={exports:{}};(function(e){var t={single_source_shortest_paths:function(o,r,n){var i={},s={};s[r]=0;var c=t.PriorityQueue.make();c.push(r,0);for(var a,g,u,E,p,h,y,x,S;!c.empty();){a=c.pop(),g=a.value,E=a.cost,p=o[g]||{};for(u in p)p.hasOwnProperty(u)&&(h=p[u],y=E+h,x=s[u],S=typeof s[u]>"u",(S||x>y)&&(s[u]=y,c.push(u,y),i[u]=g))}if(typeof n<"u"&&typeof s[n]>"u"){var b=["Could not find a path from ",r," to ",n,"."].join("");throw new Error(b)}return i},extract_shortest_path_from_predecessor_list:function(o,r){for(var n=[],i=r;i;)n.push(i),o[i],i=o[i];return n.reverse(),n},find_path:function(o,r,n){var i=t.single_source_shortest_paths(o,r,n);return t.extract_shortest_path_from_predecessor_list(i,n)},PriorityQueue:{make:function(o){var r=t.PriorityQueue,n={},i;o=o||{};for(i in r)r.hasOwnProperty(i)&&(n[i]=r[i]);return n.queue=[],n.sorter=o.sorter||r.default_sorter,n},default_sorter:function(o,r){return o.cost-r.cost},push:function(o,r){var n={value:o,cost:r};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};e.exports=t})(qt);var Te=qt.exports;(function(e){const t=z,o=pe,r=be,n=xe,i=Be,s=M,c=_,a=Te;function g(b){return unescape(encodeURIComponent(b)).length}function u(b,C,w){const d=[];let f;for(;(f=b.exec(w))!==null;)d.push({data:f[0],index:f.index,mode:C,length:f[0].length});return d}function E(b){const C=u(s.NUMERIC,t.NUMERIC,b),w=u(s.ALPHANUMERIC,t.ALPHANUMERIC,b);let d,f;return c.isKanjiModeEnabled()?(d=u(s.BYTE,t.BYTE,b),f=u(s.KANJI,t.KANJI,b)):(d=u(s.BYTE_KANJI,t.BYTE,b),f=[]),C.concat(w,d,f).sort(function(m,B){return m.index-B.index}).map(function(m){return{data:m.data,mode:m.mode,length:m.length}})}function p(b,C){switch(C){case t.NUMERIC:return o.getBitsLength(b);case t.ALPHANUMERIC:return r.getBitsLength(b);case t.KANJI:return i.getBitsLength(b);case t.BYTE:return n.getBitsLength(b)}}function h(b){return b.reduce(function(C,w){const d=C.length-1>=0?C[C.length-1]:null;return d&&d.mode===w.mode?(C[C.length-1].data+=w.data,C):(C.push(w),C)},[])}function y(b){const C=[];for(let w=0;w<b.length;w++){const d=b[w];switch(d.mode){case t.NUMERIC:C.push([d,{data:d.data,mode:t.ALPHANUMERIC,length:d.length},{data:d.data,mode:t.BYTE,length:d.length}]);break;case t.ALPHANUMERIC:C.push([d,{data:d.data,mode:t.BYTE,length:d.length}]);break;case t.KANJI:C.push([d,{data:d.data,mode:t.BYTE,length:g(d.data)}]);break;case t.BYTE:C.push([{data:d.data,mode:t.BYTE,length:g(d.data)}])}}return C}function x(b,C){const w={},d={start:{}};let f=["start"];for(let l=0;l<b.length;l++){const m=b[l],B=[];for(let A=0;A<m.length;A++){const P=m[A],T=""+l+A;B.push(T),w[T]={node:P,lastCount:0},d[T]={};for(let F=0;F<f.length;F++){const R=f[F];w[R]&&w[R].node.mode===P.mode?(d[R][T]=p(w[R].lastCount+P.length,P.mode)-p(w[R].lastCount,P.mode),w[R].lastCount+=P.length):(w[R]&&(w[R].lastCount=P.length),d[R][T]=p(P.length,P.mode)+4+t.getCharCountIndicator(P.mode,C))}}f=B}for(let l=0;l<f.length;l++)d[f[l]].end=0;return{map:d,table:w}}function S(b,C){let w;const d=t.getBestModeForData(b);if(w=t.from(C,d),w!==t.BYTE&&w.bit<d.bit)throw new Error('"'+b+'" cannot be encoded with mode '+t.toString(w)+`.
 Suggested mode is: `+t.toString(d));switch(w===t.KANJI&&!c.isKanjiModeEnabled()&&(w=t.BYTE),w){case t.NUMERIC:return new o(b);case t.ALPHANUMERIC:return new r(b);case t.KANJI:return new i(b);case t.BYTE:return new n(b)}}e.fromArray=function(C){return C.reduce(function(w,d){return typeof d=="string"?w.push(S(d,null)):d.data&&w.push(S(d.data,d.mode)),w},[])},e.fromString=function(C,w){const d=E(C,c.isKanjiModeEnabled()),f=y(d),l=x(f,w),m=a.find_path(l.map,"start","end"),B=[];for(let A=1;A<m.length-1;A++)B.push(l.table[m[A]].node);return e.fromArray(h(B))},e.rawSplit=function(C){return e.fromArray(E(C,c.isKanjiModeEnabled()))}})(Ot);const ct=_,ht=st,ve=ie,Ie=se,Se=Lt,Ae=Dt,yt=Ut,xt=at,Ne=le,it=Vt,Pe=Ht,ke=z,mt=Ot;function _e(e,t){const o=e.size,r=Ae.getPositions(t);for(let n=0;n<r.length;n++){const i=r[n][0],s=r[n][1];for(let c=-1;c<=7;c++)if(!(i+c<=-1||o<=i+c))for(let a=-1;a<=7;a++)s+a<=-1||o<=s+a||(c>=0&&c<=6&&(a===0||a===6)||a>=0&&a<=6&&(c===0||c===6)||c>=2&&c<=4&&a>=2&&a<=4?e.set(i+c,s+a,!0,!0):e.set(i+c,s+a,!1,!0))}}function Re(e){const t=e.size;for(let o=8;o<t-8;o++){const r=o%2===0;e.set(o,6,r,!0),e.set(6,o,r,!0)}}function Me(e,t){const o=Se.getPositions(t);for(let r=0;r<o.length;r++){const n=o[r][0],i=o[r][1];for(let s=-2;s<=2;s++)for(let c=-2;c<=2;c++)s===-2||s===2||c===-2||c===2||s===0&&c===0?e.set(n+s,i+c,!0,!0):e.set(n+s,i+c,!1,!0)}}function Le(e,t){const o=e.size,r=it.getEncodedBits(t);let n,i,s;for(let c=0;c<18;c++)n=Math.floor(c/3),i=c%3+o-8-3,s=(r>>c&1)===1,e.set(n,i,s,!0),e.set(i,n,s,!0)}function pt(e,t,o){const r=e.size,n=Pe.getEncodedBits(t,o);let i,s;for(i=0;i<15;i++)s=(n>>i&1)===1,i<6?e.set(i,8,s,!0):i<8?e.set(i+1,8,s,!0):e.set(r-15+i,8,s,!0),i<8?e.set(8,r-i-1,s,!0):i<9?e.set(8,15-i-1+1,s,!0):e.set(8,15-i-1,s,!0);e.set(r-8,8,1,!0)}function De(e,t){const o=e.size;let r=-1,n=o-1,i=7,s=0;for(let c=o-1;c>0;c-=2)for(c===6&&c--;;){for(let a=0;a<2;a++)if(!e.isReserved(n,c-a)){let g=!1;s<t.length&&(g=(t[s]>>>i&1)===1),e.set(n,c-a,g),i--,i===-1&&(s++,i=7)}if(n+=r,n<0||o<=n){n-=r,r=-r;break}}}function Ue(e,t,o){const r=new ve;o.forEach(function(a){r.put(a.mode.bit,4),r.put(a.getLength(),ke.getCharCountIndicator(a.mode,e)),a.write(r)});const n=ct.getSymbolTotalCodewords(e),i=xt.getTotalCodewordsCount(e,t),s=(n-i)*8;for(r.getLengthInBits()+4<=s&&r.put(0,4);r.getLengthInBits()%8!==0;)r.putBit(0);const c=(s-r.getLengthInBits())/8;for(let a=0;a<c;a++)r.put(a%2?17:236,8);return ze(r,e,t)}function ze(e,t,o){const r=ct.getSymbolTotalCodewords(t),n=xt.getTotalCodewordsCount(t,o),i=r-n,s=xt.getBlocksCount(t,o),c=r%s,a=s-c,g=Math.floor(r/s),u=Math.floor(i/s),E=u+1,p=g-u,h=new Ne(p);let y=0;const x=new Array(s),S=new Array(s);let b=0;const C=new Uint8Array(e.buffer);for(let m=0;m<s;m++){const B=m<a?u:E;x[m]=C.slice(y,y+B),S[m]=h.encode(x[m]),y+=B,b=Math.max(b,B)}const w=new Uint8Array(r);let d=0,f,l;for(f=0;f<b;f++)for(l=0;l<s;l++)f<x[l].length&&(w[d++]=x[l][f]);for(f=0;f<p;f++)for(l=0;l<s;l++)w[d++]=S[l][f];return w}function Fe(e,t,o,r){let n;if(Array.isArray(e))n=mt.fromArray(e);else if(typeof e=="string"){let g=t;if(!g){const u=mt.rawSplit(e);g=it.getBestVersionForData(u,o)}n=mt.fromString(e,g||40)}else throw new Error("Invalid data");const i=it.getBestVersionForData(n,o);if(!i)throw new Error("The amount of data is too big to be stored in a QR Code");if(!t)t=i;else if(t<i)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+i+`.
`);const s=Ue(t,o,n),c=ct.getSymbolSize(t),a=new Ie(c);return _e(a,t),Re(a),Me(a,t),pt(a,o,0),t>=7&&Le(a,t),De(a,s),isNaN(r)&&(r=yt.getBestMask(a,pt.bind(null,a,o))),yt.applyMask(r,a),pt(a,o,r),{modules:a,version:t,errorCorrectionLevel:o,maskPattern:r,segments:n}}Rt.create=function(t,o){if(typeof t>"u"||t==="")throw new Error("No input text");let r=ht.M,n,i;return typeof o<"u"&&(r=ht.from(o.errorCorrectionLevel,ht.M),n=it.from(o.version),i=yt.from(o.maskPattern),o.toSJISFunc&&ct.setToSJISFunction(o.toSJISFunc)),Fe(t,n,r,i)};var Kt={},vt={};(function(e){function t(o){if(typeof o=="number"&&(o=o.toString()),typeof o!="string")throw new Error("Color should be defined as hex string");let r=o.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+o);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(i){return[i,i]}))),r.length===6&&r.push("F","F");const n=parseInt(r.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+r.slice(0,6).join("")}}e.getOptions=function(r){r||(r={}),r.color||(r.color={});const n=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,i=r.width&&r.width>=21?r.width:void 0,s=r.scale||4;return{width:i,scale:i?4:s,margin:n,color:{dark:t(r.color.dark||"#000000ff"),light:t(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},e.getScale=function(r,n){return n.width&&n.width>=r+n.margin*2?n.width/(r+n.margin*2):n.scale},e.getImageWidth=function(r,n){const i=e.getScale(r,n);return Math.floor((r+n.margin*2)*i)},e.qrToImageData=function(r,n,i){const s=n.modules.size,c=n.modules.data,a=e.getScale(s,i),g=Math.floor((s+i.margin*2)*a),u=i.margin*a,E=[i.color.light,i.color.dark];for(let p=0;p<g;p++)for(let h=0;h<g;h++){let y=(p*g+h)*4,x=i.color.light;if(p>=u&&h>=u&&p<g-u&&h<g-u){const S=Math.floor((p-u)/a),b=Math.floor((h-u)/a);x=E[c[S*s+b]?1:0]}r[y++]=x.r,r[y++]=x.g,r[y++]=x.b,r[y]=x.a}}})(vt);(function(e){const t=vt;function o(n,i,s){n.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=s,i.width=s,i.style.height=s+"px",i.style.width=s+"px"}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}e.render=function(i,s,c){let a=c,g=s;typeof a>"u"&&(!s||!s.getContext)&&(a=s,s=void 0),s||(g=r()),a=t.getOptions(a);const u=t.getImageWidth(i.modules.size,a),E=g.getContext("2d"),p=E.createImageData(u,u);return t.qrToImageData(p.data,i,a),o(E,g,u),E.putImageData(p,0,0),g},e.renderToDataURL=function(i,s,c){let a=c;typeof a>"u"&&(!s||!s.getContext)&&(a=s,s=void 0),a||(a={});const g=e.render(i,s,a),u=a.type||"image/png",E=a.rendererOpts||{};return g.toDataURL(u,E.quality)}})(Kt);var Jt={};const Ve=vt;function _t(e,t){const o=e.a/255,r=t+'="'+e.hex+'"';return o<1?r+" "+t+'-opacity="'+o.toFixed(2).slice(1)+'"':r}function wt(e,t,o){let r=e+t;return typeof o<"u"&&(r+=" "+o),r}function je(e,t,o){let r="",n=0,i=!1,s=0;for(let c=0;c<e.length;c++){const a=Math.floor(c%t),g=Math.floor(c/t);!a&&!i&&(i=!0),e[c]?(s++,c>0&&a>0&&e[c-1]||(r+=i?wt("M",a+o,.5+g+o):wt("m",n,0),n=0,i=!1),a+1<t&&e[c+1]||(r+=wt("h",s),s=0)):n++}return r}Jt.render=function(t,o,r){const n=Ve.getOptions(o),i=t.modules.size,s=t.modules.data,c=i+n.margin*2,a=n.color.light.a?"<path "+_t(n.color.light,"fill")+' d="M0 0h'+c+"v"+c+'H0z"/>':"",g="<path "+_t(n.color.dark,"stroke")+' d="'+je(s,i,n.margin)+'"/>',u='viewBox="0 0 '+c+" "+c+'"',p='<svg xmlns="http://www.w3.org/2000/svg" '+(n.width?'width="'+n.width+'" height="'+n.width+'" ':"")+u+' shape-rendering="crispEdges">'+a+g+`</svg>
`;return typeof r=="function"&&r(null,p),p};const He=oe,Ct=Rt,Wt=Kt,$e=Jt;function It(e,t,o,r,n){const i=[].slice.call(arguments,1),s=i.length,c=typeof i[s-1]=="function";if(!c&&!He())throw new Error("Callback required as last argument");if(c){if(s<2)throw new Error("Too few arguments provided");s===2?(n=o,o=t,t=r=void 0):s===3&&(t.getContext&&typeof n>"u"?(n=r,r=void 0):(n=r,r=o,o=t,t=void 0))}else{if(s<1)throw new Error("Too few arguments provided");return s===1?(o=t,t=r=void 0):s===2&&!t.getContext&&(r=o,o=t,t=void 0),new Promise(function(a,g){try{const u=Ct.create(o,r);a(e(u,t,r))}catch(u){g(u)}})}try{const a=Ct.create(o,r);n(null,e(a,t,r))}catch(a){n(a)}}G.create=Ct.create;G.toCanvas=It.bind(null,Wt.render);G.toDataURL=It.bind(null,Wt.renderToDataURL);G.toString=It.bind(null,function(e,t,o){return $e.render(e,o)});const Oe={class:"d-flex align-center gap-3"},qe={class:"qr-header-icon-box rounded-xl p-2 bg-primary-subtle text-primary flex-shrink-0"},Ke={class:"px-4 py-3 bg-slate-900/80 d-flex justify-space-between align-center flex-wrap gap-2 no-print border-b flex-shrink-0"},Je={class:"d-flex flex-wrap gap-2"},We={class:"text-xs text-amber-400 font-medium d-flex align-center gap-1"},Ye={id:"printable-car-flyer",class:"car-flyer-poster p-5 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl max-w-[480px] mx-auto text-center"},Qe={class:"flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-200"},Ge={class:"text-left"},Xe={class:"text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-300"},Ze={key:0,class:"flex items-center justify-between bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 dir-ltr"},tn={class:"flex items-center gap-2.5"},en=["src"],nn={class:"text-base font-black text-slate-900"},on={key:0,class:"text-xs font-bold text-slate-800 flex items-center gap-1"},rn={class:"bg-slate-100 border-2 border-slate-200 text-slate-900 rounded-xl p-3.5 mb-3.5 text-center shadow-sm"},sn={class:"text-lg font-black text-slate-900 m-0 leading-snug dir-ltr"},an={class:"flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center"},ln={class:"relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-3 flex items-center justify-center",style:{width:"220px !important",height:"220px !important",margin:"0 auto !important"}},cn=["src"],dn={key:1,class:"w-48 h-48 flex items-center justify-center text-slate-400"},fn={class:"text-xs font-black text-slate-800 m-0 flex items-center gap-1.5 justify-center"},un={__name:"CarQrDialog",props:{isDialogVisible:{type:Boolean,required:!0},car:{type:Object,default:()=>null}},emits:["update:isDialogVisible"],setup(e,{emit:t}){const o=e,r=t,n=ut(""),i=ut(!1),s=ut(!1),c=V(()=>{var d;return(d=o.car)!=null&&d.id?`${window.location.origin}/user/cars/${o.car.id}`:""}),a=V(()=>{var f,l,m;if(!((f=o.car)!=null&&f.brand))return"";const d=o.car.brand;return typeof d=="string"?d:((l=d.name)==null?void 0:l.en)||((m=d.name)==null?void 0:m.ar)||d.name||""}),g=V(()=>{var f,l,m;if(!((f=o.car)!=null&&f.model))return"";const d=o.car.model;return typeof d=="string"?d:((l=d.name)==null?void 0:l.en)||((m=d.name)==null?void 0:m.ar)||d.name||""}),u=V(()=>{var d;return o.car?typeof o.car.title=="object"&&((d=o.car.title)!=null&&d.en)?o.car.title.en:typeof o.car.title=="string"&&o.car.title?o.car.title:`${a.value} ${g.value}`.trim():""}),E=V(()=>{var f,l,m;if(!((f=o.car)!=null&&f.seller))return"";const d=o.car.seller;return typeof d.store_name=="object"&&d.store_name?((l=d.store_name)==null?void 0:l.ar)||((m=d.store_name)==null?void 0:m.en)||d.name||"":d.store_name||d.name||""}),p=V(()=>{var d;return(d=o.car)!=null&&d.seller&&(o.car.seller.store_logo||o.car.seller.logo)||""}),h=V(()=>{var d,f,l,m;return((f=(d=o.car)==null?void 0:d.seller)==null?void 0:f.phone)||((l=o.car)==null?void 0:l.phone_number)||((m=o.car)==null?void 0:m.phone)||""}),y=async()=>{if(c.value){i.value=!0;try{n.value=await G.toDataURL(c.value,{width:700,margin:2,color:{dark:"#0f172a",light:"#ffffff"},errorCorrectionLevel:"H"})}catch(d){console.error("Failed to generate QR Code:",d)}finally{i.value=!1}}};St(()=>o.isDialogVisible,d=>{d&&o.car&&Zt(()=>{y()})},{immediate:!0}),St(()=>o.car,d=>{d&&o.isDialogVisible&&y()});const x=()=>{r("update:isDialogVisible",!1)},S=()=>{var P;const d=document.createElement("iframe");d.style.position="fixed",d.style.left="0",d.style.top="0",d.style.width="1000px",d.style.height="1400px",d.style.opacity="0",d.style.pointerEvents="none",d.style.zIndex="-1",document.body.appendChild(d);const f=d.contentWindow.document;f.open(),f.write(`
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
  `),f.close();const l=f.querySelectorAll("img");let m=0;const B=l.length,A=()=>{setTimeout(()=>{d.contentWindow.focus(),d.contentWindow.print(),setTimeout(()=>{document.body.contains(d)&&document.body.removeChild(d)},2e3)},200)};B===0?A():(l.forEach(T=>{T.complete&&T.naturalWidth!==0?(m++,m===B&&A()):T.onload=T.onerror=()=>{m++,m===B&&A()}}),setTimeout(()=>{m<B&&A()},1200))},b=async()=>{var d;s.value=!0;try{const f=document.createElement("canvas");f.width=1200,f.height=1600;const l=f.getContext("2d");l.fillStyle="#ffffff",l.fillRect(0,0,1200,1600),l.strokeStyle="#0f172a",l.lineWidth=14,l.beginPath(),l.roundRect(30,30,1140,1540,32),l.stroke(),l.strokeStyle="#e2e8f0",l.lineWidth=4,l.beginPath(),l.moveTo(60,160),l.lineTo(1140,160),l.stroke();const m=new Image;m.crossOrigin="anonymous",m.src="/images/logo-black.png",await new Promise(N=>{m.onload=N,m.onerror=N});let B=60;if(m.complete&&m.naturalWidth){const I=m.naturalWidth/m.naturalHeight*64;l.drawImage(m,60,60,I,64),B=60+I+20}l.textAlign="left",l.font="bold 44px system-ui, sans-serif",l.fillStyle="#0f172a",l.fillText("Negm",B,108);const A=l.measureText("Negm").width;l.fillStyle="#f97316",l.fillText("Cars",B+A,108);const P=l.measureText("Cars").width;l.fillStyle="#0f172a",l.fillText(".com",B+A+P,108),l.fillStyle="#f1f5f9",l.beginPath(),l.roundRect(940,65,200,60,30),l.fill(),l.strokeStyle="#cbd5e1",l.lineWidth=3,l.stroke(),l.fillStyle="#0f172a",l.font="bold 28px system-ui, sans-serif",l.textAlign="center",l.fillText(`ID: #${((d=o.car)==null?void 0:d.id)||""}`,1040,106);let T=190;if(E.value){l.fillStyle="#fffbe6",l.beginPath(),l.roundRect(60,T,1080,95,20),l.fill(),l.strokeStyle="#fde047",l.lineWidth=3,l.stroke();let N=90;if(p.value){const I=new Image;if(I.crossOrigin="anonymous",I.src=p.value,await new Promise(J=>{I.onload=J,I.onerror=J}),I.complete&&I.naturalWidth){let Z=60,dt=60;const ft=I.naturalWidth/I.naturalHeight;ft>1?dt=60/ft:Z=60*ft,l.drawImage(I,90,T+17.5+(60-dt)/2,Z,dt),N=170}}l.direction="ltr",l.textAlign="left",l.fillStyle="#0f172a",l.font="bold 32px system-ui, sans-serif",l.fillText(E.value,N,T+58),h.value&&(l.direction="ltr",l.textAlign="right",l.fillStyle="#1e293b",l.font="bold 26px system-ui, sans-serif",l.fillText(`📞 ${h.value}`,1110,T+58)),T+=115}l.fillStyle="#f8fafc",l.beginPath(),l.roundRect(60,T,1080,180,28),l.fill(),l.strokeStyle="#cbd5e1",l.lineWidth=3,l.stroke(),l.direction="ltr",l.fillStyle="#0f172a",l.font="bold 38px system-ui, sans-serif",l.textAlign="center";const F=u.value;if(F.length>45){const N=F.split(" "),I=Math.ceil(N.length/2),J=N.slice(0,I).join(" "),Z=N.slice(I).join(" ");l.fillText(J,600,T+70),l.fillText(Z,600,T+135)}else l.fillText(F,600,T+105);T+=200;const R=1530-T;if(l.fillStyle="#f8fafc",l.beginPath(),l.roundRect(60,T,1080,R,32),l.fill(),l.strokeStyle="#cbd5e1",l.lineWidth=4,l.stroke(),n.value){const N=new Image;N.src=n.value,await new Promise(I=>{N.onload=I}),l.fillStyle="#ffffff",l.beginPath(),l.roundRect(260,T+50,680,680,32),l.fill(),l.strokeStyle="#e2e8f0",l.lineWidth=4,l.stroke(),l.drawImage(N,290,T+80,620,620)}l.direction="rtl",l.fillStyle="#0f172a",l.font="bold 36px system-ui, sans-serif",l.textAlign="center",l.fillText("لرؤية التفاصيل والسعر استخدم qr",600,T+800),f.toBlob(async N=>{var I;N&&await C(N,`NegmCars-Poster-${((I=o.car)==null?void 0:I.id)||"car"}.png`)},"image/png",1)}catch(f){console.error("Failed to generate poster image:",f)}finally{s.value=!1}},C=async(d,f)=>{const l=new File([d],f,{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[l]}))try{await navigator.share({files:[l],title:f});return}catch(A){if(A.name!=="AbortError")console.warn("Web Share API failed, using direct download fallback:",A);else return}const m=URL.createObjectURL(d),B=document.createElement("a");B.href=m,B.download=f,document.body.appendChild(B),B.click(),document.body.removeChild(B),setTimeout(()=>URL.revokeObjectURL(m),1e4)},w=async()=>{var d;if(n.value)try{const l=await(await fetch(n.value)).blob();await C(l,`car-qr-${((d=o.car)==null?void 0:d.id)||"poster"}.png`)}catch(f){console.error("Failed to download QR:",f)}};return(d,f)=>(H(),At(ee,{"model-value":e.isDialogVisible,"max-width":"640",scrollable:"","onUpdate:modelValue":x},{default:j(()=>[k(Gt,{class:"qr-dialog-card rounded-2xl overflow-hidden shadow-2xl border border-slate-700"},{default:j(()=>[k(Qt,{class:"d-flex align-center justify-space-between pa-4 bg-surface text-foreground no-print border-b flex-shrink-0"},{default:j(()=>[v("div",Oe,[v("div",qe,[k(L,{icon:"tabler-qrcode",size:"26"})]),f[0]||(f[0]=v("div",null,[v("h3",{class:"text-base font-bold m-0"},"بطاقة QR Code للسيارة - NegmCars.com"),v("p",{class:"text-xs opacity-75 m-0"},"جاهزة للطباعة وتحميل الصورة على ورقة A4 كاملة")],-1))]),k(tt,{icon:"tabler-x",variant:"text",density:"comfortable",onClick:x})]),_:1}),v("div",Ke,[v("div",Je,[k(tt,{color:"primary",size:"small",class:"font-bold rounded-lg shadow",onClick:S},{default:j(()=>[k(L,{icon:"tabler-printer",class:"me-1.5"}),f[1]||(f[1]=D(" طباعة (Print) "))]),_:1}),k(tt,{color:"success",size:"small",class:"font-bold rounded-lg shadow",loading:s.value,onClick:b},{default:j(()=>[k(L,{icon:"tabler-photo-down",class:"me-1.5"}),f[2]||(f[2]=D(" تحميل صورة (PNG) "))]),_:1},8,["loading"]),k(tt,{color:"secondary",variant:"outlined",size:"small",class:"font-bold rounded-lg",onClick:w},{default:j(()=>[k(L,{icon:"tabler-download",class:"me-1.5"}),f[3]||(f[3]=D(" QR فقط "))]),_:1})]),v("span",We,[k(L,{icon:"tabler-info-circle",size:"15"}),f[4]||(f[4]=D(" طباعة صفحة A4 واحدة "))])]),k(te,{class:"pa-4 printable-wrapper"},{default:j(()=>{var l;return[v("div",Ye,[v("div",Qe,[f[5]||(f[5]=v("div",{class:"flex items-center gap-2.5"},[v("img",{src:ne,alt:"NegmCars",style:{height:"34px !important",width:"auto !important","max-height":"34px !important","max-width":"120px !important","object-fit":"contain !important",display:"inline-block !important"},class:"rounded-md flex-shrink-0"}),v("span",{class:"text-xl font-black tracking-tight text-slate-900 leading-none"},[D(" Negm"),v("span",{class:"text-amber-500"},"Cars"),D(".com ")])],-1)),v("div",Ge,[v("span",Xe,"ID: #"+et((l=e.car)==null?void 0:l.id),1)])]),E.value?(H(),W("div",Ze,[v("div",tn,[p.value?(H(),W("img",{key:0,src:p.value,alt:"Showroom Logo",style:{width:"34px !important",height:"34px !important","max-width":"34px !important","max-height":"34px !important","object-fit":"contain !important","border-radius":"8px !important","flex-shrink":"0 !important"},class:"bg-white border border-amber-300"},null,8,en)):(H(),At(L,{key:1,icon:"tabler-building-store",size:"22",class:"text-amber-700"})),v("span",nn,et(E.value),1)]),h.value?(H(),W("div",on,[k(L,{icon:"tabler-phone",size:"14",class:"text-amber-700"}),D(" "+et(h.value),1)])):Nt("",!0)])):Nt("",!0),v("div",rn,[v("h1",sn,et(u.value),1)]),v("div",an,[v("div",ln,[n.value?(H(),W("img",{key:0,src:n.value,alt:"Car QR Code",style:{width:"194px !important",height:"194px !important","max-width":"194px !important","max-height":"194px !important","object-fit":"contain !important",display:"block !important",margin:"0 auto !important"}},null,8,cn)):(H(),W("div",dn,[k(Xt,{indeterminate:"",color:"primary"})]))]),v("p",fn,[k(L,{icon:"tabler-scan",size:"16",class:"text-amber-600"}),f[6]||(f[6]=D(" لرؤية التفاصيل والسعر استخدم qr "))])])])]}),_:1})]),_:1})]),_:1},8,["model-value"]))}},bn=Yt(un,[["__scopeId","data-v-f1edfc9e"]]);export{bn as C};
