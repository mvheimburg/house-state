const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),s=new WeakMap;let i=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const a=this.t;if(t&&void 0===e){const t=void 0!==a&&1===a.length;t&&(e=s.get(a)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&s.set(a,e))}return e}toString(){return this.cssText}};const n=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const a of e.cssRules)t+=a.cssText;return(e=>new i("string"==typeof e?e:e+"",void 0,a))(t)})(e):e,{is:r,defineProperty:o,getOwnPropertyDescriptor:l,getOwnPropertyNames:d,getOwnPropertySymbols:c,getPrototypeOf:h}=Object,p=globalThis,u=p.trustedTypes,v=u?u.emptyScript:"",m=p.reactiveElementPolyfillSupport,g=(e,t)=>e,f={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let a=e;switch(t){case Boolean:a=null!==e;break;case Number:a=null===e?null:Number(e);break;case Object:case Array:try{a=JSON.parse(e)}catch(e){a=null}}return a}},y=(e,t)=>!r(e,t),b={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const a=Symbol(),s=this.getPropertyDescriptor(e,a,t);void 0!==s&&o(this.prototype,e,s)}}static getPropertyDescriptor(e,t,a){const{get:s,set:i}=l(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const n=s?.call(this);i?.call(this,t),this.requestUpdate(e,n,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const e=this.properties,t=[...d(e),...c(e)];for(const a of t)this.createProperty(a,e[a])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,a]of t)this.elementProperties.set(e,a)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const a=this._$Eu(e,t);void 0!==a&&this._$Eh.set(a,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const a=new Set(e.flat(1/0).reverse());for(const e of a)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const a=t.attribute;return!1===a?void 0:"string"==typeof a?a:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const a of t.keys())this.hasOwnProperty(a)&&(e.set(a,this[a]),delete this[a]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const a=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((a,s)=>{if(t)a.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of s){const s=document.createElement("style"),i=e.litNonce;void 0!==i&&s.setAttribute("nonce",i),s.textContent=t.cssText,a.appendChild(s)}})(a,this.constructor.elementStyles),a}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,a){this._$AK(e,a)}_$ET(e,t){const a=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,a);if(void 0!==s&&!0===a.reflect){const i=(void 0!==a.converter?.toAttribute?a.converter:f).toAttribute(t,a.type);this._$Em=e,null==i?this.removeAttribute(s):this.setAttribute(s,i),this._$Em=null}}_$AK(e,t){const a=this.constructor,s=a._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=a.getPropertyOptions(s),i="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:f;this._$Em=s;const n=i.fromAttribute(t,e.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(e,t,a,s=!1,i){if(void 0!==e){const n=this.constructor;if(!1===s&&(i=this[e]),a??=n.getPropertyOptions(e),!((a.hasChanged??y)(i,t)||a.useDefault&&a.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,a))))return;this.C(e,t,a)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:a,reflect:s,wrapped:i},n){a&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==i||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||a||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,a]of e){const{wrapped:e}=a,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,a,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[g("elementProperties")]=new Map,$[g("finalized")]=new Map,m?.({ReactiveElement:$}),(p.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,w=e=>e,_=x.trustedTypes,k=_?_.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+A,C=`<${O}>`,M=document,E=()=>M.createComment(""),H=e=>null===e||"object"!=typeof e&&"function"!=typeof e,N=Array.isArray,I="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,F=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,P=/"/g,j=/^(?:script|style|textarea|title)$/i,B=e=>(t,...a)=>({_$litType$:e,strings:t,values:a}),U=B(1),z=B(2),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),q=new WeakMap,J=M.createTreeWalker(M,129);function G(e,t){if(!N(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const K=(e,t)=>{const a=e.length-1,s=[];let i,n=2===t?"<svg>":3===t?"<math>":"",r=T;for(let t=0;t<a;t++){const a=e[t];let o,l,d=-1,c=0;for(;c<a.length&&(r.lastIndex=c,l=r.exec(a),null!==l);)c=r.lastIndex,r===T?"!--"===l[1]?r=D:void 0!==l[1]?r=R:void 0!==l[2]?(j.test(l[2])&&(i=RegExp("</"+l[2],"g")),r=F):void 0!==l[3]&&(r=F):r===F?">"===l[0]?(r=i??T,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?F:'"'===l[3]?P:L):r===P||r===L?r=F:r===D||r===R?r=T:(r=F,i=void 0);const h=r===F&&e[t+1].startsWith("/>")?" ":"";n+=r===T?a+C:d>=0?(s.push(o),a.slice(0,d)+S+a.slice(d)+A+h):a+A+(-2===d?t:h)}return[G(e,n+(e[a]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class Z{constructor({strings:e,_$litType$:t},a){let s;this.parts=[];let i=0,n=0;const r=e.length-1,o=this.parts,[l,d]=K(e,t);if(this.el=Z.createElement(l,a),J.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=J.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(S)){const t=d[n++],a=s.getAttribute(e).split(A),r=/([.?@])?(.*)/.exec(t);o.push({type:1,index:i,name:r[2],strings:a,ctor:"."===r[1]?te:"?"===r[1]?ae:"@"===r[1]?se:ee}),s.removeAttribute(e)}else e.startsWith(A)&&(o.push({type:6,index:i}),s.removeAttribute(e));if(j.test(s.tagName)){const e=s.textContent.split(A),t=e.length-1;if(t>0){s.textContent=_?_.emptyScript:"";for(let a=0;a<t;a++)s.append(e[a],E()),J.nextNode(),o.push({type:2,index:++i});s.append(e[t],E())}}}else if(8===s.nodeType)if(s.data===O)o.push({type:2,index:i});else{let e=-1;for(;-1!==(e=s.data.indexOf(A,e+1));)o.push({type:7,index:i}),e+=A.length-1}i++}}static createElement(e,t){const a=M.createElement("template");return a.innerHTML=e,a}}function X(e,t,a=e,s){if(t===V)return t;let i=void 0!==s?a._$Co?.[s]:a._$Cl;const n=H(t)?void 0:t._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),void 0===n?i=void 0:(i=new n(e),i._$AT(e,a,s)),void 0!==s?(a._$Co??=[])[s]=i:a._$Cl=i),void 0!==i&&(t=X(e,i._$AS(e,t.values),i,s)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:a}=this._$AD,s=(e?.creationScope??M).importNode(t,!0);J.currentNode=s;let i=J.nextNode(),n=0,r=0,o=a[0];for(;void 0!==o;){if(n===o.index){let t;2===o.type?t=new Q(i,i.nextSibling,this,e):1===o.type?t=new o.ctor(i,o.name,o.strings,this,e):6===o.type&&(t=new ie(i,this,e)),this._$AV.push(t),o=a[++r]}n!==o?.index&&(i=J.nextNode(),n++)}return J.currentNode=M,s}p(e){let t=0;for(const a of this._$AV)void 0!==a&&(void 0!==a.strings?(a._$AI(e,a,t),t+=a.strings.length-2):a._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,a,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=a,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=X(this,e,t),H(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==V&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>N(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&H(this._$AH)?this._$AA.nextSibling.data=e:this.T(M.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:a}=e,s="number"==typeof a?this._$AC(e):(void 0===a.el&&(a.el=Z.createElement(G(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new Y(s,this),a=e.u(this.options);e.p(t),this.T(a),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Z(e)),t}k(e){N(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let a,s=0;for(const i of e)s===t.length?t.push(a=new Q(this.O(E()),this.O(E()),this,this.options)):a=t[s],a._$AI(i),s++;s<t.length&&(this._$AR(a&&a._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,a,s,i){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=i,a.length>2||""!==a[0]||""!==a[1]?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=W}_$AI(e,t=this,a,s){const i=this.strings;let n=!1;if(void 0===i)e=X(this,e,t,0),n=!H(e)||e!==this._$AH&&e!==V,n&&(this._$AH=e);else{const s=e;let r,o;for(e=i[0],r=0;r<i.length-1;r++)o=X(this,s[a+r],t,r),o===V&&(o=this._$AH[r]),n||=!H(o)||o!==this._$AH[r],o===W?e=W:e!==W&&(e+=(o??"")+i[r+1]),this._$AH[r]=o}n&&!s&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class ae extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class se extends ee{constructor(e,t,a,s,i){super(e,t,a,s,i),this.type=5}_$AI(e,t=this){if((e=X(this,e,t,0)??W)===V)return;const a=this._$AH,s=e===W&&a!==W||e.capture!==a.capture||e.once!==a.once||e.passive!==a.passive,i=e!==W&&(a===W||s);s&&this.element.removeEventListener(this.name,this,a),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,a){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(e){X(this,e)}}const ne=x.litHtmlPolyfillSupport;ne?.(Z,Q),(x.litHtmlVersions??=[]).push("3.3.3");const re=globalThis;class oe extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,a)=>{const s=a?.renderBefore??t;let i=s._$litPart$;if(void 0===i){const e=a?.renderBefore??null;s._$litPart$=i=new Q(t.insertBefore(E(),e),e,void 0,a??{})}return i._$AI(e),i})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}oe._$litElement$=!0,oe.finalized=!0,re.litElementHydrateSupport?.({LitElement:oe});const le=re.litElementPolyfillSupport;le?.({LitElement:oe}),(re.litElementVersions??=[]).push("4.2.2");const de={home:z`<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path>`,away:z`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>`,vacation:z`<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`,day:z`<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>`,night:z`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>`,tv:z`<rect x="2" y="6" width="20" height="13" rx="2"></rect><path d="M8 2l4 4 4-4"></path>`,eating:z`<path d="M7 2v8a2 2 0 0 0 4 0V2M9 10v12"></path><path d="M17 2c-1.7 1.5-2.5 3.5-2.5 6s1 3.5 2.5 3.5V22"></path>`,overlay:z`<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>`,apply:z`<path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 3v6h-6"></path>`,spinner:z`<path d="M21 12a9 9 0 1 1-6.2-8.56"></path>`,warning:z`<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path>`,water:z`<path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z"></path>`,key:z`<circle cx="7.5" cy="15.5" r="4.5"></circle><path d="M10.7 12.3 21 2M16 7l3 3"></path>`,chevron:z`<path d="m6 9 6 6 6-6"></path>`,cog:z`<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,menu:z`<path d="M4 6h16M4 12h16M4 18h16"></path>`,plus:z`<path d="M12 5v14M5 12h14"></path>`,trash:z`<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"></path><path d="M10 11v6M14 11v6"></path>`,check:z`<path d="M20 6 9 17l-5-5"></path>`,close:z`<path d="M18 6 6 18M6 6l12 12"></path>`,star:z`<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"></path>`,flag:z`<path d="M5 21V4M5 4h11l-2 4 2 4H5"></path>`,state:z`<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle>`,calendar:z`<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>`,people:z`<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"></path>`,guest:z`<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>`,tree:z`<path d="M5 4v14a2 2 0 0 0 2 2h3M5 9h5"></path><rect x="12" y="6" width="8" height="6" rx="2"></rect><rect x="12" y="16" width="8" height="6" rx="2"></rect>`,advanced:z`<path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle>`,info:z`<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>`},ce=new Set(["home","away","vacation","day","night","tv","eating"]),he=e=>ce.has(e)?e:"state",pe=(e,t="")=>de[e]?U`<svg class="i ${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${de[e]}</svg>`:null,ue={title:"House State",menu:"Open the sidebar",entry:"House",unsaved:"Unsaved changes",allSaved:"All changes saved",save:"Save",saving:"Saving…",discard:"Discard",cancel:"Cancel",close:"Close",retry:"Try again",reload:"Reload",loading:"Loading the configuration…",loadFailed:"Could not load the configuration",notConfiguredTitle:"No house set up yet",notConfiguredBody:"Add House State under Settings → Devices & services to create your first house. Its settings appear here afterwards.",addIntegration:"Add House State",saved:"Saved. House State reloads; no scenes were applied.",saveFailed:"Could not save",invalidTitle:"The configuration was not saved",conflict:"The settings were changed somewhere else since you opened them. Reload to see the saved version; your unsaved changes here are lost.",reloadDiscards:"Reload saved settings",warningsTitle:"Some scenes need attention",warningsBody:"These scenes or their members are missing in Home Assistant. You can save anyway and fix the scenes later. Saving never applies scenes.",saveAnyway:"Save anyway",leaveTitle:"Discard unsaved changes?",leaveBody:"Switching house throws away the changes you have not saved.",discardTitle:"Discard all changes?",discardBody:"The draft goes back to the saved settings.",issues:"{count} to fix",issuesOne:"1 to fix",sections:{states:"States",overlays:"Overlays",presence:"Presence & arrival",night:"Night",visits:"Visits",water:"Water",advanced:"Advanced"},sectionHints:{states:"The state tree, scenes, occupancy and roles",overlays:"Seasonal and manual scenes on top of the state",presence:"What counts as coming home and leaving",night:"When the night role starts by itself",visits:"Guest visits while nobody is home",water:"Valves closed during vacation",advanced:"Legacy helpers"},tree:"State tree",treeHint:"Selecting a state follows its default child. The scene comes from the nearest state that has one.",addTopLevel:"Add top-level state",addChild:"Add child state",deleteState:"Delete state",newState:"New state",selectState:"Select a state to edit it.",editState:"Edit state",name:"Name",id:"ID",idHint:"Lowercase letters, digits and underscores, starting with a letter. It cannot change after saving.",idFixed:"Fixed ID. Automations and entities use it, so it stays when you rename this.",parent:"Parent",topLevel:"— Top level",defaultChild:"Default child",noDefaultChild:"— None (stay on this state)",noChildren:"Add a child state to choose a default child.",scene:"Scene",noScene:"No scene",sceneInherits:"Inherits {scene} from {name}",sceneNone:"No scene on this path",sceneMissing:"Not found in Home Assistant",occupancy:"Occupancy",inherit:"Inherit",inherited:"inherited",someoneHome:"Someone home",nobodyHome:"Nobody home",inheritsFrom:"inherited from {name}",inheritedDefault:"nobody home unless a parent says otherwise",movesDefault:"Moving it clears the default child of {name}.",defaultBadge:"Default",defaultOf:"Default child of {name}",initialBadge:"Start",initialState:"Start state",initialHint:"Used when House State starts without a remembered state.",roles:"Roles",rolesHint:"Automations switch to these states. Arrival and night must lead to someone home; departure and vacation to nobody home.",roleOff:"— Off",role:{arrival:"Arrival",departure:"Departure",vacation:"Vacation",night:"Night"},roleNeedsHome:"{role} must lead to a state where someone is home",roleNeedsAway:"{role} must lead to a state where nobody is home",roleMissing:"{role} points to a state that no longer exists",leadsTo:"Leads to {name}",deleteTitle:"Delete {name}?",deleteIntro:"This changes the draft as follows:",deleteRemove:"{name} is removed.",deleteReparent:"{names} move to {parent}.",deleteReparentRoot:"{names} become top-level states.",deleteDefault:"{name} no longer has a default child.",deleteRole:"The {role} role is turned off.",deleteWhenState:"Overlay {name} no longer lists it among its states.",deleteInitial:"It is the start state. Choose a new start state:",deleteBlockedLast:"The last state cannot be deleted. Add another state first.",deleteBlockedOverlay:"Overlay {names} is only allowed in this state. Deleting it would make that overlay apply everywhere. Change the overlay first.",openOverlay:"Open {name}",delete:"Delete",overlaysHint:"An overlay scene runs after the state's scene. Rules can switch an overlay on by calendar or date; the highest priority wins, then the order in this list.",addOverlay:"Add overlay",newOverlay:"New overlay",editOverlay:"Edit overlay",deleteOverlay:"Delete overlay",deleteOverlayTitle:"Delete overlay {name}?",deleteOverlayBody:"The overlay and its rule are removed from the draft.",noOverlays:"No overlays yet.",selectOverlay:"Select an overlay to edit it.",priority:"Priority",priorityHint:"−100 to 100; higher wins.",activation:"Activation",manual:"Manual",calendar:"Calendar",dates:"Dates",calendarEntity:"Calendar",match:"Event title pattern",matchHint:"Optional regular expression. Empty means any event in the calendar.",matchInvalid:"This pattern is not a valid regular expression",calendarRequired:"Choose a calendar",dateKind:"Kind of date",fixed:"Fixed dates",easter:"Around Easter",nthWeekday:"Weekday in a month",from:"From",to:"To",month:"Month",day:"Day",easterHint:"Days from Easter Sunday: −2 is Good Friday, 1 is Easter Monday.",easterFrom:"First day",easterTo:"Last day",easterOrder:"The first day must not come after the last day",occurrence:"Which",weekday:"Weekday",countFrom:"Counted",inMonth:"Within a month",fromDate:"From a date",anchor:"Date",lasts:"Lasts (days)",noSuchDay:"There is no such day",conditions:"Only when",whenOccupied:"Occupancy",any:"Any",whenState:"Only in these states",whenStateHint:"None selected means every state.",sumManual:"Manual only",sumCalendar:"Calendar: {calendar}",sumMatch:"{text} matching “{match}”",sumFixed:"Every year {from} → {to}",sumEaster:"Easter {from} to {to} days",sumEasterSunday:"Easter Sunday",sumNthMonth:"{nth} {weekday} in {month}",sumNthAfter:"{nth} {weekday} after {date}",sumNthBefore:"{nth} {weekday} before {date}",sumDays:"{text} for {days}",dayOne:"1 day",dayMany:"{count} days",sumHome:"Only when someone is home",sumAway:"Only when nobody is home",sumStates:"Only in: {states}",sumPriority:"Priority {priority}",ordinal:{1:"1st",2:"2nd",3:"3rd",4:"4th",5:"5th","-1":"last","-2":"2nd to last","-3":"3rd to last","-4":"4th to last","-5":"5th to last"},ordinalAnchor:{1:"1st",2:"2nd",3:"3rd",4:"4th",5:"5th","-1":"1st","-2":"2nd","-3":"3rd","-4":"4th","-5":"5th"},direction:"Before or after",before:"Before",after:"After",weekdays:{mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},weekdaysInline:{mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsInline:["January","February","March","April","May","June","July","August","September","October","November","December"],presenceHint:"Unlocking a door or opening a gate counts as coming home. People tracked by Home Assistant can trigger arrival and departure.",doors:"Door locks",gates:"Gates",people:"People",autoReturn:"Automatic arrival",autoReturnHint:"Switch to the arrival state when a door or gate opens or a person comes home while nobody is.",autoAway:"Automatic departure",autoAwayHint:"Switch to the departure state when every person has left, after the waiting time.",awayGrace:"Wait before departure",arrivalDelay:"Arrival delay after a lock or gate",arrivalDelayHint:"Waits so a guest visit announced just after (for example from a door panel) is not mistaken for the family coming home. 0 means at once.",nightHint:"Switch to the night role automatically.",schedule:"Schedule",off:"Off",fixedTime:"Fixed time",sun:"Sunset or sunrise",time:"Local time",sunEvent:"Sun event",sunset:"Sunset",sunrise:"Sunrise",offset:"Offset",minutes:"min",hours:"h",seconds:"s",nightAt:"Night starts at {time}.",nightSunExact:"Night starts at {event}.",nightSunBefore:"Night starts {offset} before {event}.",nightSunAfter:"Night starts {offset} after {event}.",nightOff:"Night only starts when someone chooses it.",nightRoleOff:"The night role is off, so the schedule has nothing to switch to. Choose a night state under States → Roles.",timeInvalid:"Enter a time",visitsHint:"A guest visit keeps the house in its unoccupied state while a guest is inside: arrival from locks and gates is ignored during the visit and the exit window after it. People still count and end the visit.",visitDuration:"Default visit length",visitMax:"Longest allowed visit",exitGrace:"Exit window after a visit",reapply:"Apply the scene again when a visit ends",reapplyHint:"Only while nobody is home.",visitLocks:"Locks to lock when a visit ends",durationOverMax:"The default visit is longer than the longest allowed visit",outOfRange:"Allowed: {min} to {max}",waterHint:"Valves that close while the house is in the vacation state (or below it). A guest visit opens them while it lasts. Saving settings never operates valves.",valves:"Water valves",waterRoleOff:"The vacation role is off, so the valves never close. Choose a vacation state under States → Roles.",legacy:"Legacy helpers",legacyHint:"Optional input_select helpers that mirror the chosen state and overlay, for older dashboards and automations. Leave empty to stop mirroring.",legacyState:"State mirror",legacyOverlay:"Overlay mirror",nameRequired:"Enter a name",nameTooLong:"Use at most 100 characters",idInvalid:"Use lowercase letters, digits and underscores, starting with a letter",idDuplicate:"Another item already uses this ID",idReserved:"none and auto are reserved",remove:"Remove {name}",addEntity:"Add",entityPlaceholder:"Entity ID",starterStates:{home:"Home",day:"Day",idle:"None",tv:"TV",eating:"Eating",night:"Night",away:"Away",vacation:"Vacation"},starterOverlays:{christmas:"Christmas",halloween:"Halloween",party:"Party"}},ve={title:"Hustilstand",menu:"Åpne sidepanelet",entry:"Hus",unsaved:"Endringer som ikke er lagret",allSaved:"Alle endringer er lagret",save:"Lagre",saving:"Lagrer …",discard:"Forkast",cancel:"Avbryt",close:"Lukk",retry:"Prøv igjen",reload:"Last inn på nytt",loading:"Henter innstillingene …",loadFailed:"Kunne ikke hente innstillingene",notConfiguredTitle:"Ingen hus er satt opp ennå",notConfiguredBody:"Legg til House State under Innstillinger → Enheter og tjenester for å opprette det første huset. Innstillingene vises her etterpå.",addIntegration:"Legg til House State",saved:"Lagret. House State lastes inn på nytt; ingen scener ble aktivert.",saveFailed:"Kunne ikke lagre",invalidTitle:"Innstillingene ble ikke lagret",conflict:"Innstillingene er endret et annet sted etter at du åpnet dem. Last inn på nytt for å se den lagrede versjonen; endringene du ikke har lagret her, går tapt.",reloadDiscards:"Last inn lagrede innstillinger",warningsTitle:"Noen scener trenger tilsyn",warningsBody:"Disse scenene eller entitetene i dem mangler i Home Assistant. Du kan lagre likevel og rette scenene senere. Lagring aktiverer aldri scener.",saveAnyway:"Lagre likevel",leaveTitle:"Forkaste endringene?",leaveBody:"Bytter du hus, forsvinner endringene du ikke har lagret.",discardTitle:"Forkaste alle endringer?",discardBody:"Utkastet går tilbake til de lagrede innstillingene.",issues:"{count} å rette",issuesOne:"1 å rette",sections:{states:"Tilstander",overlays:"Overlegg",presence:"Hjemkomst og avreise",night:"Natt",visits:"Gjestebesøk",water:"Vann",advanced:"Avansert"},sectionHints:{states:"Tilstandstreet, scener, tilstedeværelse og roller",overlays:"Sesong- og manuelle scener oppå tilstanden",presence:"Hva som teller som å komme hjem og dra",night:"Når nattrollen starter av seg selv",visits:"Gjestebesøk mens ingen er hjemme",water:"Ventiler som stenges i ferien",advanced:"Gamle hjelpeentiteter"},tree:"Tilstandstre",treeHint:"Når en tilstand velges, følges standardbarnet. Scenen hentes fra nærmeste tilstand som har en.",addTopLevel:"Legg til tilstand øverst",addChild:"Legg til undertilstand",deleteState:"Slett tilstand",newState:"Ny tilstand",selectState:"Velg en tilstand for å redigere den.",editState:"Rediger tilstand",name:"Navn",id:"ID",idHint:"Små bokstaver, tall og understrek, og start med en bokstav. Den kan ikke endres etter lagring.",idFixed:"Fast ID. Automatiseringer og entiteter bruker den, så den beholdes når du endrer navnet.",parent:"Forelder",topLevel:"— Øverst",defaultChild:"Standardbarn",noDefaultChild:"— Ingen (bli i denne tilstanden)",noChildren:"Legg til en undertilstand for å velge standardbarn.",scene:"Scene",noScene:"Ingen scene",sceneInherits:"Arver {scene} fra {name}",sceneNone:"Ingen scene på denne veien",sceneMissing:"Finnes ikke i Home Assistant",occupancy:"Tilstedeværelse",inherit:"Arv",inherited:"arvet",someoneHome:"Noen hjemme",nobodyHome:"Ingen hjemme",inheritsFrom:"arvet fra {name}",inheritedDefault:"ingen hjemme med mindre en forelder sier noe annet",movesDefault:"Flyttingen fjerner standardbarnet til {name}.",defaultBadge:"Standard",defaultOf:"Standardbarn for {name}",initialBadge:"Start",initialState:"Starttilstand",initialHint:"Brukes når House State starter uten en husket tilstand.",roles:"Roller",rolesHint:"Automatiseringer bytter til disse tilstandene. Hjemkomst og natt må føre til noen hjemme; avreise og ferie til ingen hjemme.",roleOff:"— Av",role:{arrival:"Hjemkomst",departure:"Avreise",vacation:"Ferie",night:"Natt"},roleNeedsHome:"{role} må føre til en tilstand med noen hjemme",roleNeedsAway:"{role} må føre til en tilstand uten noen hjemme",roleMissing:"{role} peker på en tilstand som ikke finnes lenger",leadsTo:"Fører til {name}",deleteTitle:"Slette {name}?",deleteIntro:"Dette endrer utkastet slik:",deleteRemove:"{name} fjernes.",deleteReparent:"{names} flyttes til {parent}.",deleteReparentRoot:"{names} flyttes øverst i treet.",deleteDefault:"{name} får ikke lenger noe standardbarn.",deleteRole:"Rollen {role} slås av.",deleteWhenState:"Overlegget {name} har den ikke lenger blant sine tilstander.",deleteInitial:"Den er starttilstand. Velg ny starttilstand:",deleteBlockedLast:"Den siste tilstanden kan ikke slettes. Legg til en annen tilstand først.",deleteBlockedOverlay:"Overlegget {names} er bare tillatt i denne tilstanden. Sletting ville gjort at overlegget gjelder overalt. Endre overlegget først.",openOverlay:"Åpne {name}",delete:"Slett",overlaysHint:"En overleggsscene kjøres etter scenen for tilstanden. Regler kan slå på et overlegg etter kalender eller dato; høyest prioritet vinner, deretter rekkefølgen i listen.",addOverlay:"Legg til overlegg",newOverlay:"Nytt overlegg",editOverlay:"Rediger overlegg",deleteOverlay:"Slett overlegg",deleteOverlayTitle:"Slette overlegget {name}?",deleteOverlayBody:"Overlegget og regelen fjernes fra utkastet.",noOverlays:"Ingen overlegg ennå.",selectOverlay:"Velg et overlegg for å redigere det.",priority:"Prioritet",priorityHint:"−100 til 100; høyest vinner.",activation:"Aktivering",manual:"Manuelt",calendar:"Kalender",dates:"Datoer",calendarEntity:"Kalender",match:"Mønster for hendelsestittel",matchHint:"Valgfritt regulært uttrykk. Tomt betyr alle hendelser i kalenderen.",matchInvalid:"Mønsteret er ikke et gyldig regulært uttrykk",calendarRequired:"Velg en kalender",dateKind:"Type dato",fixed:"Faste datoer",easter:"Rundt påske",nthWeekday:"Ukedag i en måned",from:"Fra",to:"Til",month:"Måned",day:"Dag",easterHint:"Dager fra påskedag: −2 er langfredag, 1 er andre påskedag.",easterFrom:"Første dag",easterTo:"Siste dag",easterOrder:"Første dag kan ikke komme etter siste dag",occurrence:"Hvilken",weekday:"Ukedag",countFrom:"Telles",inMonth:"Innenfor en måned",fromDate:"Fra en dato",anchor:"Dato",lasts:"Varer (dager)",noSuchDay:"Den dagen finnes ikke",conditions:"Bare når",whenOccupied:"Tilstedeværelse",any:"Uansett",whenState:"Bare i disse tilstandene",whenStateHint:"Ingen valgt betyr alle tilstander.",sumManual:"Bare manuelt",sumCalendar:"Kalender: {calendar}",sumMatch:"{text} som passer «{match}»",sumFixed:"Hvert år {from} → {to}",sumEaster:"Påske {from} til {to} dager",sumEasterSunday:"Påskedag",sumNthMonth:"{nth} {weekday} i {month}",sumNthAfter:"{nth} {weekday} etter {date}",sumNthBefore:"{nth} {weekday} før {date}",sumDays:"{text} i {days}",dayOne:"1 dag",dayMany:"{count} dager",sumHome:"Bare når noen er hjemme",sumAway:"Bare når ingen er hjemme",sumStates:"Bare i: {states}",sumPriority:"Prioritet {priority}",ordinal:{1:"1.",2:"2.",3:"3.",4:"4.",5:"5.","-1":"siste","-2":"nest siste","-3":"3. siste","-4":"4. siste","-5":"5. siste"},ordinalAnchor:{1:"1.",2:"2.",3:"3.",4:"4.",5:"5.","-1":"1.","-2":"2.","-3":"3.","-4":"4.","-5":"5."},direction:"Før eller etter",before:"Før",after:"Etter",weekdays:{mon:"Mandag",tue:"Tirsdag",wed:"Onsdag",thu:"Torsdag",fri:"Fredag",sat:"Lørdag",sun:"Søndag"},weekdaysInline:{mon:"mandag",tue:"tirsdag",wed:"onsdag",thu:"torsdag",fri:"fredag",sat:"lørdag",sun:"søndag"},months:["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"],monthsInline:["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"],presenceHint:"Når en dør låses opp eller en port åpnes, teller det som hjemkomst. Personer som Home Assistant følger, kan utløse hjemkomst og avreise.",doors:"Låser for hjemkomst",gates:"Porter for hjemkomst",people:"Personer",autoReturn:"Automatisk hjemkomst",autoReturnHint:"Bytt til hjemkomsttilstanden når en dør eller port åpnes eller en person kommer hjem mens ingen er hjemme.",autoAway:"Automatisk avreise",autoAwayHint:"Bytt til avreisetilstanden når alle personene har dratt, etter ventetiden.",awayGrace:"Ventetid før avreise",arrivalDelay:"Forsinkelse for hjemkomst etter lås eller port",arrivalDelayHint:"Venter slik at et gjestebesøk som meldes like etter (for eksempel fra et dørpanel), ikke tolkes som at familien kommer hjem. 0 gir hjemkomst med én gang.",nightHint:"Bytt automatisk til nattrollen.",schedule:"Tidsplan",off:"Av",fixedTime:"Fast klokkeslett",sun:"Soloppgang eller solnedgang",time:"Lokalt klokkeslett",sunEvent:"Solhendelse",sunset:"Solnedgang",sunrise:"Soloppgang",offset:"Forskyvning",minutes:"min",hours:"t",seconds:"s",nightAt:"Natt starter kl. {time}.",nightSunExact:"Natt starter ved {event}.",nightSunBefore:"Natt starter {offset} før {event}.",nightSunAfter:"Natt starter {offset} etter {event}.",nightOff:"Natt starter bare når noen velger den.",nightRoleOff:"Nattrollen er av, så tidsplanen har ingenting å bytte til. Velg en natttilstand under Tilstander → Roller.",timeInvalid:"Skriv inn et klokkeslett",visitsHint:"Et gjestebesøk holder huset i ubebodd tilstand mens en gjest er inne: hjemkomst fra lås og port ignoreres under besøket og i utgangsvinduet etterpå. Personer teller fortsatt og avslutter besøket.",visitDuration:"Standard besøkslengde",visitMax:"Lengste tillatte besøk",exitGrace:"Utgangsvindu etter besøk",reapply:"Bruk scenen på nytt når besøket avsluttes",reapplyHint:"Bare mens ingen er hjemme.",visitLocks:"Låser som låses når besøket avsluttes",durationOverMax:"Standard besøk er lengre enn lengste tillatte besøk",outOfRange:"Tillatt: {min} til {max}",waterHint:"Ventiler som stenger vannet mens huset er i ferietilstanden (eller under den). Et gjestebesøk åpner vannet så lenge det varer. Lagring av innstillinger betjener aldri ventiler.",valves:"Vannventiler",waterRoleOff:"Ferierollen er av, så ventilene stenges aldri. Velg en ferietilstand under Tilstander → Roller.",legacy:"Gamle hjelpeentiteter",legacyHint:"Valgfrie input_select-hjelpere som speiler valgt tilstand og overlegg, for eldre dashbord og automatiseringer. La feltet stå tomt for å stoppe speilingen.",legacyState:"Speiling av tilstand",legacyOverlay:"Speiling av overlegg",nameRequired:"Skriv inn et navn",nameTooLong:"Bruk høyst 100 tegn",idInvalid:"Bruk små bokstaver, tall og understrek, og start med en bokstav",idDuplicate:"Denne ID-en er allerede i bruk",idReserved:"none og auto er reservert",remove:"Fjern {name}",addEntity:"Legg til",entityPlaceholder:"Entitets-ID",starterStates:{home:"Hjemme",day:"Dag",idle:"Ingen",tv:"TV",eating:"Spiser",night:"Natt",away:"Borte",vacation:"Ferie"},starterOverlays:{christmas:"Jul",halloween:"Halloween",party:"Fest"}};function me(e){return"nb"===function(e){const t=String(e?.language||e?.locale?.language||"en").toLowerCase().replace(/_/g,"-");return/^(nb|no|nn)(-|$)/.test(t)?"nb":"en"}(e)?ve:ue}function ge(e,t,a){return ue[a][t.id]===t.name&&e[a][t.id]?e[a][t.id]:t.name}function fe(e,t){return e.replace(/\{(\w+)\}/g,(e,a)=>String(t[a]??""))}const ye=["arrival","departure","vacation","night"],be=/^[a-z][a-z0-9_]*$/,$e=["none","auto"],xe=["mon","tue","wed","thu","fri","sat","sun"],we={min_duration:60,max_duration:604800},_e=e=>JSON.parse(JSON.stringify(e));function ke(e,t="state"){const a=e.toLowerCase().replace(/æ/g,"ae").replace(/ø/g,"o").replace(/ß/g,"ss").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");return(/^[a-z]/.test(a)?a:a?`${t}_${a}`:t).slice(0,64).replace(/_+$/,"")}function Se(e,t){const a=new Set(t);if(!a.has(e))return e;for(let t=2;;t++){const s=`_${t}`,i=e.slice(0,64-s.length)+s;if(!a.has(i))return i}}const Ae=e=>new Map(e.map(e=>[e.id,e])),Oe=(e,t)=>e.filter(e=>e.parent===t);function Ce(e,t){const a=new Set([t]);let s=!0;for(;s;){s=!1;for(const t of e)t.parent&&a.has(t.parent)&&!a.has(t.id)&&(a.add(t.id),s=!0)}return a}function Me(e,t){const a=Ae(e),s=[];let i=t;for(;i&&a.has(i)&&!s.includes(i);)s.unshift(i),i=a.get(i).parent;return s}function Ee(e,t){const a=Ae(e),s=Me(e,t);for(let e=s.length-1;e>=0;e--){const i=a.get(s[e]).occupied;if(null!=i)return{value:i,source:s[e],inherited:s[e]!==t}}return{value:!1,source:null,inherited:!0}}function He(e,t){const a=Ae(e),s=new Set;let i=t;for(;!s.has(i);){s.add(i);const e=a.get(i)?.default_child;if(!e||!a.has(e))break;i=e}return i}function Ne(e,t){const a=Ae(e),s=Me(e,t);for(let e=s.length-1;e>=0;e--){const t=a.get(s[e]).scene;if(t)return{scene:t,source:s[e]}}return null}const Ie={arrival:!0,night:!0,departure:!1,vacation:!1};function Te(e,t){const a=e.roles[t];if(!a)return null;if(!e.state_tree.some(e=>e.id===a))return"missing";const s=He(e.state_tree,a);return Ee(e.state_tree,s).value===Ie[t]?null:Ie[t]?"needsHome":"needsAway"}function De(e){const t=new Set(e.map(e=>e.id)),a=[],s=new Set,i=(t,n)=>{if(!s.has(t.id)){s.add(t.id),a.push({node:t,depth:n});for(const a of Oe(e,t.id))i(a,n+1)}};for(const a of e)a.parent&&t.has(a.parent)||i(a,0);for(const t of e)i(t,0);return a}function Re(e,t,a){const s=_e(e);for(const e of s.state_tree)e.id===t&&(e.id=a),e.parent===t&&(e.parent=a),e.default_child===t&&(e.default_child=a);s.initial_state===t&&(s.initial_state=a);for(const e of ye)s.roles[e]===t&&(s.roles[e]=a);for(const e of s.overlays)e.when_state&&(e.when_state=e.when_state.map(e=>e===t?a:e));return s}function Fe(e,t){const a=e.state_tree,s=a.find(e=>e.id===t),i=e.overlays.filter(e=>e.when_state?.length&&1===new Set(e.when_state).size&&e.when_state[0]===t);return{blocked:a.length<=1?"last":i.length?"overlay":null,blockingOverlays:i,reparented:Oe(a,t),newParent:a.find(e=>e.id===s?.parent)??null,defaultCleared:a.filter(e=>e.default_child===t),rolesCleared:ye.filter(a=>e.roles[a]===t),overlaysTrimmed:e.overlays.filter(e=>e.when_state?.includes(t)),needsInitial:e.initial_state===t}}const Le=[31,29,31,30,31,30,31,31,30,31,30,31];function Pe(e){const t=/^(\d{2})-(\d{2})$/.exec(e??"");if(!t)return!1;const a=Number(t[1]),s=Number(t[2]);return a>=1&&a<=12&&s>=1&&s<=Le[a-1]}const je=(e,t)=>`${String(e).padStart(2,"0")}-${String(t).padStart(2,"0")}`;function Be(e){const[t,a]=(e??"01-01").split("-").map(Number);return[t||1,a||1]}function Ue(e){return"fixed"===e?{type:"fixed",from:"12-01",to:"12-26"}:"easter"===e?{type:"easter",from:-3,to:1}:{type:"nth_weekday",weekday:"sun",nth:1,days:1,month:1}}const ze=e=>void 0!==e.calendar?"calendar":e.dates?"dates":"manual";const Ve=e=>Math.round(60*e);function We(e){return e.trim()?e.length>100?"nameTooLong":null:"nameRequired"}function qe(e,t=[]){const a=new Map;return e.forEach((s,i)=>{!be.test(s)||s.length>64?a.set(i,"idInvalid"):t.includes(s)?a.set(i,"idReserved"):e.indexOf(s)===i&&e.lastIndexOf(s)===i||a.set(i,"idDuplicate")}),a}function Je(e,t=we){const a=[],s=qe(e.state_tree.map(e=>e.id));e.state_tree.forEach((e,t)=>{const i=We(e.name);i&&a.push({section:"states",field:`state:${t}:name`,key:i});const n=s.get(t);n&&a.push({section:"states",field:`state:${t}:id`,key:n})});for(const t of ye){const s=Te(e,t);s&&a.push({section:"states",field:`role:${t}`,key:"missing"===s?"roleMissing":"needsHome"===s?"roleNeedsHome":"roleNeedsAway",params:{role:t}})}const i=qe(e.overlays.map(e=>e.id),$e);e.overlays.forEach((e,t)=>{const s=e=>`overlay:${t}:${e}`,n=We(e.name);n&&a.push({section:"overlays",field:s("name"),key:n});const r=i.get(t);r&&a.push({section:"overlays",field:s("id"),key:r}),void 0===e.calendar||e.calendar.startsWith("calendar.")||a.push({section:"overlays",field:s("calendar"),key:"calendarRequired"}),e.match&&!function(e){try{return new RegExp(e),!0}catch{return!1}}(e.match)&&a.push({section:"overlays",field:s("match"),key:"matchInvalid"});const o=e.dates;if("fixed"===o?.type)for(const e of["from","to"])Pe(o[e])||a.push({section:"overlays",field:s(e),key:"noSuchDay"});"easter"===o?.type&&o.from>o.to&&a.push({section:"overlays",field:s("easter"),key:"easterOrder"}),"nth_weekday"===o?.type&&(void 0===o.anchor||Pe(o.anchor)||a.push({section:"overlays",field:s("anchor"),key:"noSuchDay"}),o.days>=1&&o.days<=366||a.push({section:"overlays",field:s("days"),key:"outOfRange",params:{min:1,max:366}}))});const n=(t,s,i,n)=>{const r=e[s];r>=i&&r<=n||a.push({section:t,field:s,key:"outOfRange",params:{min:i,max:n}})};n("presence","auto_away_grace",0,604800),n("presence","arrival_delay",0,60),n("visits","visit_duration",t.min_duration,t.max_duration),n("visits","visit_max_duration",t.min_duration,t.max_duration),n("visits","visit_exit_grace",0,3600),e.visit_duration>e.visit_max_duration&&a.push({section:"visits",field:"visit_duration",key:"durationOverMax"});const r=e.night_schedule;return"fixed"!==r.type||/^\d{2}:\d{2}:\d{2}$/.test(r.time)||a.push({section:"night",field:"night_time",key:"timeInvalid"}),"sun"!==r.type||Math.abs(r.offset)<=86400||a.push({section:"night",field:"night_offset",key:"outOfRange",params:{min:-1440,max:1440}}),a}function Ge(e){if(!e)return"";const t=e.overlays.map(e=>{const t={...e};return null===t.when_occupied&&delete t.when_occupied,Array.isArray(t.when_state)&&!t.when_state.length&&delete t.when_state,0===t.priority&&delete t.priority,""===t.match&&delete t.match,t}),a=e=>Array.isArray(e)?e.map(a):e&&"object"==typeof e?Object.fromEntries(Object.entries(e).filter(([,e])=>void 0!==e).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,a(t)])):e;return JSON.stringify(a({...e,overlays:t}))}const Ke=e=>e.target.value,Ze=(e,t)=>U`
  ${e?U`<span class="hint">${e}</span>`:W}
  ${t?U`<span class="error-text" role="alert"
          >${pe("warning","xs")}${t}</span
        >`:W}
`,Xe=e=>U`
  <label class="field">
    <span class="label">${e.label}</span>
    <input
      id=${e.id??W}
      class=${e.mono?"mono":""}
      type="text"
      autocomplete="off"
      spellcheck="false"
      maxlength=${e.maxlength??W}
      placeholder=${e.placeholder??W}
      ?readonly=${e.readonly}
      aria-invalid=${e.error?"true":"false"}
      .value=${e.value}
      @input=${t=>e.onInput?.(Ke(t))}
      @change=${t=>e.onChange?.(Ke(t))}
    />
    ${Ze(e.hint,e.error)}
  </label>
`,Ye=e=>U`
  <label class="field ${e.compact?"compact":""}">
    <span class=${e.hideLabel?"sr-only":"label"}>${e.label}</span>
    <select
      id=${e.id??W}
      aria-invalid=${e.error?"true":"false"}
      @change=${t=>e.onChange(Ke(t))}
    >
      ${e.options.map(t=>U`<option
            value=${t.value}
            ?selected=${t.value===e.value}
          >
            ${t.label}
          </option>`)}
    </select>
    ${Ze(e.hint,e.error)}
  </label>
`,Qe=e=>U`
  <label class="field ${e.compact?"compact":""}">
    <span class=${e.hideLabel?"sr-only":"label"}>${e.label}</span>
    <span class="with-unit">
      <input
        id=${e.id??W}
        type="number"
        inputmode="numeric"
        min=${e.min??W}
        max=${e.max??W}
        step=${e.step??1}
        aria-invalid=${e.error?"true":"false"}
        .value=${Number.isFinite(e.value)?String(e.value):""}
        @change=${t=>{const a=Ke(t).trim();e.onChange(""===a?0:Number(a))}}
      />
      ${e.unit?U`<span class="unit">${e.unit}</span>`:W}
    </span>
    ${Ze(e.hint,e.error)}
  </label>
`,et=e=>{const t=function(e,t){let a=Math.max(0,Math.round(e));const s={h:0,m:0,s:0};return t.includes("h")&&(s.h=Math.floor(a/3600),a-=3600*s.h),t.includes("m")&&(s.m=t.includes("s")?Math.floor(a/60):a/60,a-=60*Math.floor(s.m)),t.includes("s")&&(s.s=a),s}(e.seconds,e.units),a={h:e.strings.hours,m:e.strings.minutes,s:e.strings.seconds},s=(a,s)=>{const i={...t,[a]:Math.max(0,Number(s)||0)};e.onChange((e=>Math.round(3600*e.h+60*e.m+e.s))(i))};return U`
    <div class="field" role="group" aria-label=${e.label} id=${e.id??W}>
      <span class="label">${e.label}</span>
      <span class="duration">
        ${e.units.map(i=>U`
            <span class="with-unit">
              <input
                type="number"
                inputmode="numeric"
                min="0"
                step=${"m"!==i||e.units.includes("s")?1:"any"}
                data-unit=${i}
                aria-label=${`${e.label} (${a[i]})`}
                aria-invalid=${e.error?"true":"false"}
                ?disabled=${e.disabled}
                .value=${String(t[i])}
                @change=${e=>s(i,Ke(e))}
              />
              <span class="unit">${a[i]}</span>
            </span>
          `)}
      </span>
      ${Ze(e.hint,e.error)}
    </div>
  `},tt=e=>U`
  <div class="field">
    ${e.hideLabel?W:U`<span class="label">${e.label}</span>`}
    <div
      class="segment"
      role="radiogroup"
      aria-label=${e.label}
      data-name=${e.name??W}
    >
      ${e.options.map(t=>U`
          <button
            type="button"
            role="radio"
            class="pill ${t.value===e.value?"active":""}"
            aria-checked=${t.value===e.value?"true":"false"}
            data-value=${t.value}
            @click=${()=>t.value!==e.value&&e.onChange(t.value)}
          >
            ${t.value===e.value?pe("check","s"):W}${t.label}
          </button>
        `)}
    </div>
    ${Ze(e.hint,e.error)}
  </div>
`,at=e=>U`
  <label class="toggle-row">
    <span class="toggle-text">
      <span class="toggle-label">${e.label}</span>
      ${e.hint?U`<span class="hint">${e.hint}</span>`:W}
    </span>
    <input
      id=${e.id??W}
      type="checkbox"
      role="switch"
      class="switch"
      .checked=${e.checked}
      @change=${t=>e.onChange(t.target.checked)}
    />
  </label>
`,st=(e,t)=>e.states?.[t]?.attributes?.friendly_name;function it(e){const t={entity:{domain:1===e.domains.length?e.domains[0]:e.domains,multiple:!!e.multiple}};if(customElements.get("ha-selector"))return U`
      <div class="field picker" data-picker=${e.name}>
        <ha-selector
          .hass=${e.hass}
          .selector=${t}
          .value=${e.multiple?[...e.value]:e.value||void 0}
          .label=${e.label}
          .required=${!1}
          @value-changed=${t=>{t.stopPropagation();const a=t.detail?.value;e.onChange(e.multiple?Array.isArray(a)?a:[]:a||"")}}
        ></ha-selector>
        ${Ze(e.hint,e.error)}
      </div>
    `;const a=`list-${e.name}`,s=U`<datalist id=${a}>
    ${(i=e.hass,n=e.domains,Object.keys(i.states??{}).filter(e=>n.includes(e.split(".")[0])).sort()).map(t=>U`<option value=${t}>${st(e.hass,t)??t}</option>`)}
  </datalist>`;var i,n;if(!e.multiple)return U`
      <label class="field picker" data-picker=${e.name}>
        <span class="label">${e.label}</span>
        <input
          class="mono"
          type="text"
          list=${a}
          autocomplete="off"
          spellcheck="false"
          placeholder=${`${e.domains[0]}.…`}
          .value=${e.value||""}
          @change=${t=>e.onChange(Ke(t).trim())}
        />
        ${s} ${Ze(e.hint,e.error)}
      </label>
    `;const r=e.value;return U`
    <div class="field picker" data-picker=${e.name}>
      <span class="label">${e.label}</span>
      ${r.length?U`<div class="chips">
              ${r.map(t=>U`<span class="chip"
                    ><span
                      >${st(e.hass,t)??t}
                      ${st(e.hass,t)?U`<span class="mono muted">${t}</span>`:W}</span
                    ><button
                      type="button"
                      class="chip-x"
                      aria-label=${fe(e.strings.remove,{name:t})}
                      @click=${()=>e.onChange(r.filter(e=>e!==t))}
                    >
                      ${pe("close","xs")}
                    </button></span
                  >`)}
            </div>`:W}
      <span class="add-row">
        <input
          class="mono"
          type="text"
          list=${a}
          autocomplete="off"
          spellcheck="false"
          aria-label=${e.label}
          placeholder=${`${e.domains[0]}.…`}
          @change=${t=>(t=>{const a=t.value.trim();a&&!r.includes(a)&&e.onChange([...r,a]),t.value=""})(t.target)}
        />
      </span>
      ${s} ${Ze(e.hint,e.error)}
    </div>
  `}const nt=((e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,a,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[s+1],e[0]);return new i(s,e,a)})`
  :host {
    display: block;
    min-height: 100%;
    box-sizing: border-box;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    font-family: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, inherit)
    );
    -webkit-font-smoothing: antialiased;
    --hs-text: var(--primary-text-color, #1b1b1a);
    --hs-muted: var(--secondary-text-color, #5b5a55);
    --hs-home: var(--success-color, #2e7d32);
    --hs-away: var(--warning-color, #f59e0b);
    --hs-neutral: var(--primary-color, #03a9f4);
    --hs-error: var(--error-color, #c62828);
    --hs-surface: var(--ha-card-background, var(--card-background-color, #fff));
    --hs-pill: var(--secondary-background-color, #f3f2ee);
    --hs-line: var(--divider-color, rgba(0, 0, 0, 0.12));
    --hs-radius: var(--ha-card-border-radius, 16px);
    --hs-bar: var(
      --app-header-background-color,
      var(--primary-background-color)
    );
    --hs-bar-text: var(--app-header-text-color, var(--primary-text-color));
    --accent: var(--hs-neutral);
  }
  * {
    box-sizing: border-box;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  #state-editor,
  #overlay-editor {
    scroll-margin-top: 150px;
  }
  [hidden] {
    display: none !important;
  }
  .i {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }
  .i.s {
    width: 18px;
    height: 18px;
  }
  .i.xs {
    width: 15px;
    height: 15px;
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
    }
  }
  .mono {
    font-family: var(
      --ha-font-family-code,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace
    );
    font-size: 0.92em;
  }
  .muted {
    color: var(--hs-muted);
  }

  /* ------------------------------------------------------------ top bar */
  .bar {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 64px;
    padding: 8px max(16px, env(safe-area-inset-right)) 8px
      max(16px, env(safe-area-inset-left));
    color: var(--hs-bar-text);
    background: var(--hs-bar);
    border-bottom: 1px solid var(--hs-line);
  }
  .bar-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1 1 240px;
  }
  .titles {
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }
  .subtitle {
    font-size: 13px;
    color: var(--hs-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .entry-select {
    min-height: 40px;
    max-width: 220px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-muted);
    white-space: nowrap;
  }
  .status.dirty {
    color: color-mix(in srgb, var(--hs-away) 70%, var(--hs-text));
  }
  .status .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
  :host([narrow]) .actions {
    width: 100%;
    margin-left: 0;
  }
  :host([narrow]) .actions .status {
    flex: 1;
    white-space: normal;
  }

  /* ------------------------------------------------------------ buttons */
  button {
    font: inherit;
    color: inherit;
  }
  .btn {
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    color: var(--hs-text);
    background: var(--hs-pill);
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }
  .btn.primary {
    color: var(--text-primary-color, #fff);
    background: var(--primary-color, #03a9f4);
  }
  .btn.danger {
    color: var(--hs-error);
    background: color-mix(in srgb, var(--hs-error) 12%, var(--hs-pill));
  }
  .btn.danger.solid {
    color: #fff;
    background: color-mix(in srgb, var(--hs-error) 88%, #000);
  }
  .btn.ghost {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--hs-line);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .btn:focus-visible,
  .icon-btn:focus-visible,
  .pill:focus-visible,
  .node:focus-visible,
  .item:focus-visible,
  .tab:focus-visible,
  .acc-head:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
  .icon-btn {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--hs-muted);
    background: var(--hs-pill);
    cursor: pointer;
  }

  /* ------------------------------------------------------------ banners */
  .banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0 0 16px;
    padding: 12px 14px;
    border-radius: var(--hs-radius);
    background: color-mix(in srgb, var(--accent) 14%, var(--hs-surface));
    --accent: var(--hs-neutral);
  }
  .banner.success {
    --accent: var(--hs-home);
  }
  .banner.error {
    --accent: var(--hs-error);
  }
  .banner.warn {
    --accent: var(--hs-away);
  }
  .banner .text {
    flex: 1;
    min-width: 0;
    align-self: center;
    overflow-wrap: anywhere;
  }
  .banner strong {
    display: block;
  }
  .banner .detail {
    font-size: 14px;
    color: var(--hs-text);
  }
  .banner > .i {
    margin-top: 2px;
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
  }

  /* ------------------------------------------------------------ page */
  main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 24px 48px;
  }
  :host([narrow]) main {
    padding: 12px 16px 48px;
  }
  main[inert] {
    opacity: 0.6;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }
  .tab {
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 16px 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--hs-muted);
    background: transparent;
    cursor: pointer;
  }
  .tab:hover {
    background: var(--hs-pill);
  }
  .tab[aria-selected="true"] {
    color: color-mix(in srgb, var(--primary-color) 70%, var(--hs-text));
    background: color-mix(in srgb, var(--primary-color) 16%, var(--hs-surface));
  }
  .count {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    display: inline-grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: color-mix(in srgb, var(--hs-error) 88%, #000);
  }

  /* Accordion on narrow screens */
  .accordion {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .acc {
    border-radius: var(--hs-radius);
    background: var(--hs-surface);
    box-shadow: var(--ha-card-box-shadow, none);
    border: 1px solid var(--hs-line);
    overflow: hidden;
  }
  .acc-head {
    width: 100%;
    min-height: 64px;
    border: 0;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    background: transparent;
    cursor: pointer;
  }
  .acc-text {
    flex: 1;
    min-width: 0;
  }
  .acc-title {
    display: block;
    font-weight: 700;
  }
  .acc-hint {
    display: block;
    font-size: 13px;
    color: var(--hs-muted);
  }
  .chev {
    color: var(--hs-muted);
    transition: transform 0.15s;
  }
  .acc.open .chev {
    transform: rotate(180deg);
  }
  .acc-body {
    padding: 0 12px 14px;
  }
  .acc-body .card {
    border: 0;
    box-shadow: none;
    padding: 4px 4px 8px;
    background: transparent;
  }
  .acc-body .card + .card {
    border-top: 1px solid var(--hs-line);
    border-radius: 0;
    padding-top: 16px;
  }

  /* ------------------------------------------------------------ cards */
  .card {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: var(--hs-radius);
    background: var(--hs-surface);
    border: 1px solid var(--hs-line);
    box-shadow: var(--ha-card-box-shadow, none);
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .card-head .grow {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
  }
  h3 {
    margin: 4px 0 0;
    font-size: 15px;
    font-weight: 700;
  }
  .lead {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-muted);
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(340px, 5fr);
    gap: 16px;
    align-items: start;
  }
  .column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .sticky {
    position: sticky;
    top: 80px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 760px;
  }
  :host([narrow]) .split {
    grid-template-columns: minmax(0, 1fr);
  }
  :host([narrow]) .sticky {
    position: static;
  }
  .circ {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .circ.sm {
    flex-basis: 36px;
    width: 36px;
    height: 36px;
  }
  .tone-home {
    --accent: var(--hs-home);
  }
  .tone-away {
    --accent: var(--hs-away);
  }
  .tone-overlay {
    --accent: var(--hs-away);
  }
  .tone-neutral {
    --accent: var(--hs-neutral);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 12px;
    text-align: center;
    color: var(--hs-muted);
  }
  .center-page {
    max-width: 520px;
    margin: 12vh auto 0;
  }

  /* ------------------------------------------------------------ tree */
  .tree {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .node,
  .item {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: 14px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    background: transparent;
    cursor: pointer;
  }
  .node:hover,
  .item:hover {
    background: color-mix(in srgb, var(--hs-text) 4%, transparent);
  }
  .node[aria-current="true"],
  .item[aria-current="true"] {
    background: color-mix(in srgb, var(--primary-color) 13%, var(--hs-surface));
    box-shadow: inset 0 0 0 2px
      color-mix(in srgb, var(--primary-color) 55%, transparent);
  }
  .indent {
    flex: 0 0 auto;
    align-self: stretch;
    display: flex;
  }
  .guide {
    width: 22px;
    border-left: 2px solid var(--hs-line);
    margin-left: 17px;
  }
  .guide + .guide {
    margin-left: 0;
  }
  :host([narrow]) .guide {
    width: 12px;
    margin-left: 8px;
  }
  .node-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .node-name {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 8px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .node-id {
    font-weight: 400;
    color: var(--hs-muted);
    font-size: 12px;
  }
  .node-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    font-size: 13px;
    color: var(--hs-muted);
  }
  .node-meta > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
    max-width: 50%;
  }
  :host([narrow]) .badges {
    max-width: 40%;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 22px;
    padding: 1px 9px;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: color-mix(in srgb, var(--accent) 72%, var(--hs-text));
    background: color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .badge.outline {
    background: transparent;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .badge.error {
    --accent: var(--hs-error);
  }
  .badge.role {
    --accent: var(--hs-neutral);
  }
  .badge.start {
    --accent: var(--hs-neutral);
    color: var(--text-primary-color, #fff);
    background: color-mix(in srgb, var(--primary-color) 85%, #000);
  }
  .occ {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent);
  }
  .occ.inherited {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ------------------------------------------------------------ forms */
  .fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-muted);
  }
  .hint {
    font-size: 13px;
    line-height: 1.4;
    color: var(--hs-muted);
  }
  .error-text {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-error);
  }
  .error-text .i {
    margin-top: 1px;
  }
  input[type="text"],
  input[type="number"],
  input[type="time"],
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
    padding: 0 12px;
    font: inherit;
    color: var(--hs-text);
    background: var(--hs-pill);
    color-scheme: light dark;
  }
  input[readonly] {
    color: var(--hs-muted);
    background: transparent;
  }
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 0;
    border-color: transparent;
  }
  [aria-invalid="true"] {
    border-color: var(--hs-error) !important;
  }
  .with-unit {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .with-unit input {
    flex: 1;
    min-width: 0;
  }
  .unit {
    font-size: 14px;
    color: var(--hs-muted);
    min-width: 22px;
  }
  .duration {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .duration .with-unit {
    flex: 1 1 110px;
  }
  .compact {
    flex: 1 1 120px;
  }
  .row-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }
  .segment {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pill {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 600;
    color: var(--hs-text);
    background: var(--hs-pill);
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .pill.active {
    color: color-mix(in srgb, var(--primary-color) 70%, var(--hs-text));
    background: color-mix(in srgb, var(--primary-color) 20%, var(--hs-pill));
  }
  .pills-multi .pill {
    flex: 0 1 auto;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 52px;
    cursor: pointer;
  }
  .toggle-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .toggle-label {
    font-weight: 600;
  }
  .switch {
    appearance: none;
    flex: 0 0 auto;
    position: relative;
    width: 48px;
    height: 28px;
    margin: 8px 0;
    border-radius: 14px;
    background: color-mix(in srgb, var(--hs-text) 22%, transparent);
    cursor: pointer;
    transition: background 0.15s;
  }
  .switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s;
  }
  .switch:checked {
    background: var(--primary-color, #03a9f4);
  }
  .switch:checked::after {
    transform: translateX(20px);
  }
  .switch:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 4px 0 12px;
    border-radius: 18px;
    background: var(--hs-pill);
    overflow-wrap: anywhere;
  }
  .chip-x {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: transparent;
    color: var(--hs-muted);
    cursor: pointer;
  }
  .add-row {
    display: flex;
    gap: 8px;
  }
  .note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.4;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    --accent: var(--hs-away);
  }
  .note.info {
    --accent: var(--hs-neutral);
  }
  .note > .i {
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
  }
  .preview {
    padding: 10px 12px;
    border-radius: 12px;
    font-weight: 600;
    background: var(--hs-pill);
  }
  .divider {
    height: 1px;
    background: var(--hs-line);
    margin: 2px 0;
  }
  .editor-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    padding-top: 4px;
  }
  ha-selector {
    display: block;
  }

  /* ------------------------------------------------------------ dialogs */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.5);
  }
  .dialog {
    width: min(540px, 100%);
    max-height: calc(100vh - 32px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 24px;
    background: var(--hs-surface);
    color: var(--hs-text);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }
  :host([narrow]) .scrim {
    place-items: end stretch;
    padding: 0;
  }
  :host([narrow]) .dialog {
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
  .dialog-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dialog-head h2 {
    font-size: 20px;
  }
  .effects {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .effects li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    line-height: 1.4;
  }
  .effects li .i {
    margin-top: 1px;
    color: var(--hs-muted);
  }
  .dialog-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
`;function rt(e,t){return e?.[t]?.attributes?.friendly_name||t}function ot(e,t){const[a,s]=Be(e);try{return new Intl.DateTimeFormat(t,{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2024,a-1,s)))}catch{return e}}function lt(e,t,a={}){try{return new Intl.NumberFormat(t,a).format(e)}catch{return String(e)}}function dt(e,t,a){const[s,i,n]=e.split(":").map(Number);if([s,i].some(e=>Number.isNaN(e)))return e;const r="12"===a||"24"!==a&&void 0;try{return new Intl.DateTimeFormat(t,{hour:"numeric",minute:"2-digit",...n?{second:"2-digit"}:{},hour12:r,timeZone:"UTC"}).format(new Date(Date.UTC(2024,0,1,s,i,n||0)))}catch{return e}}function ct(e,t,a){return 1===t?e.dayOne:fe(e.dayMany,{count:lt(t,a)})}function ht(e,t){const{strings:a,locale:s}=t;if(void 0!==e.calendar){const s=fe(a.sumCalendar,{calendar:e.calendar?rt(t.states,e.calendar):"—"});return e.match?fe(a.sumMatch,{text:s,match:e.match}):s}const i=e.dates;if(!i)return a.sumManual;if("fixed"===i.type)return fe(a.sumFixed,{from:ot(i.from,s),to:ot(i.to,s)});if("easter"===i.type){if(0===i.from&&0===i.to)return a.sumEasterSunday;const e=e=>lt(e,s,{signDisplay:"exceptZero"}).replace(/^-/,"−");return fe(a.sumEaster,{from:e(i.from),to:e(i.to)})}const n=a.weekdaysInline[i.weekday]??i.weekday;let r;return r=void 0!==i.anchor?fe(i.nth<0?a.sumNthBefore:a.sumNthAfter,{nth:a.ordinalAnchor[String(i.nth)]??String(i.nth),weekday:n,date:ot(i.anchor,s)}):fe(a.sumNthMonth,{nth:a.ordinal[String(i.nth)]??String(i.nth),weekday:n,month:a.monthsInline[(i.month??1)-1]??String(i.month)}),fe(a.sumDays,{text:r,days:ct(a,i.days,s)})}function pt(e,t,a){const s=Math.abs(t)/60;if(s>=60&&Number.isInteger(s)){const t=Math.floor(s/60),i=s%60;return i?`${lt(t,a)} ${e.hours} ${lt(i,a)} ${e.minutes}`:`${lt(t,a)} ${e.hours}`}return`${lt(s,a,{maximumFractionDigits:2})} ${e.minutes}`}const ut=[{id:"states",icon:"tree"},{id:"overlays",icon:"overlay"},{id:"presence",icon:"people"},{id:"night",icon:"night"},{id:"visits",icon:"guest"},{id:"water",icon:"water"},{id:"advanced",icon:"advanced"}],vt=e=>e?.message||String(e);class mt extends oe{constructor(){super(...arguments),this.narrow=!1,this.loading=!0,this.entries=[],this.limits=we,this.section="states",this.selectedState=null,this.selectedOverlay=null,this.saving=!1,this.newIds=new Set,this.idTouched=new Set,this.requested=!1,this.savedCanonical="",this.onBeforeUnload=e=>{this.dirty&&(e.preventDefault(),e.returnValue="")}}connectedCallback(){super.connectedCallback(),window.addEventListener("beforeunload",this.onBeforeUnload),customElements.get("ha-selector")||(!async function(){if(!customElements.get("ha-selector"))try{const e=await(window.loadCardHelpers?.()),t=await(e?.createCardElement?.({type:"entities",entities:[]}));await(t?.constructor?.getConfigElement?.())}catch{}}(),customElements.whenDefined("ha-selector").then(()=>this.requestUpdate()))}disconnectedCallback(){window.removeEventListener("beforeunload",this.onBeforeUnload),super.disconnectedCallback()}updated(e){e.has("hass")&&this.hass&&!this.requested&&(this.requested=!0,this.load())}get t(){return me(this.hass)}get locale(){return function(e){const t=String(e?.language||e?.locale?.language||"en").toLowerCase().replace(/_/g,"-").replace(/^(no|nn)(-|$)/,"nb$2");try{return Intl.getCanonicalLocales(t)[0]||"en"}catch{return"en"}}(this.hass)}get dirty(){return!!this.draft&&Ge(this.draft)!==this.savedCanonical}get issues(){return this.draft?Je(this.draft,this.limits):[]}get summaryContext(){return{strings:this.t,locale:this.locale,states:this.hass?.states,tree:this.draft?.state_tree??[],timeFormat:this.hass?.locale?.time_format}}async load(e=this.entryId){if(this.hass){this.loading=!0,this.loadError=void 0;try{const t=await this.hass.callWS({type:"house_state/config/get",...e?{entry_id:e}:{}});this.entries=t.entries??[],this.entryId=t.entry_id,this.applySaved(t.config,t.revision),t.limits&&(this.limits=t.limits)}catch(e){this.loadError=vt(e)}finally{this.loading=!1}}}applySaved(e,t){this.saved=e?_e(e):void 0,this.draft=e?_e(e):void 0,this.savedCanonical=Ge(e),this.revision=t,this.newIds.clear(),this.idTouched.clear(),this.pendingId=void 0,e?.state_tree.some(e=>e.id===this.selectedState)||(this.selectedState=null),e?.overlays.some(e=>e.id===this.selectedOverlay)||(this.selectedOverlay=null)}edit(e){this.draft=e,"saved"===this.banner?.kind&&(this.banner=void 0)}change(e){if(!this.draft)return;const t=_e(this.draft);e(t),this.edit(t)}discard(){this.saved&&(this.applySaved(this.saved,this.revision),this.banner=void 0,this.dialog=void 0)}async save(e=!1){if(!this.hass||!this.draft||!this.entryId||this.saving)return;this.saving=!0,this.banner=void 0,this.dialog=void 0;const t=_e(this.draft);try{if(!e){const e=await this.hass.callWS({type:"house_state/config/validate",entry_id:this.entryId,config:t});if(!e.valid)return void(this.banner={kind:"invalid",detail:e.error})}const a=await this.hass.callWS({type:"house_state/config/save",entry_id:this.entryId,config:t,revision:this.revision,...e?{acknowledge_warnings:!0}:{}});a.saved?(this.revision=a.revision,this.applySaved(t,a.revision),this.banner={kind:"saved"},await this.refresh()):a.error?this.banner={kind:"invalid",detail:a.error}:this.dialog={kind:"warnings",warnings:a.warnings??[]}}catch(e){this.banner="conflict"===e?.code?{kind:"conflict"}:{kind:"failed",detail:vt(e)}}finally{this.saving=!1}}async refresh(){try{const e=await this.hass.callWS({type:"house_state/config/get",entry_id:this.entryId});e.config&&(this.entries=e.entries??this.entries,this.applySaved(e.config,e.revision))}catch{}}async reloadAfterConflict(){this.banner=void 0,await this.load(this.entryId)}chooseEntry(e){e!==this.entryId&&(this.dirty?this.dialog={kind:"switchEntry",entryId:e}:this.switchEntry(e))}async switchEntry(e){this.dialog=void 0,this.banner=void 0,this.selectedState=null,this.selectedOverlay=null,await this.load(e)}stateName(e){return ge(this.t,e,"starterStates")}overlayName(e){return ge(this.t,e,"starterOverlays")}stateLabel(e){const t=this.draft?.state_tree.find(t=>t.id===e);return t?this.stateName(t):e??""}stateOptions(e=new Set){return De(this.draft.state_tree).filter(({node:t})=>!e.has(t.id)).map(({node:e,depth:t})=>({value:e.id,label:`${"  ".repeat(t)}${this.stateName(e)} (${e.id})`}))}issueText(e){if(!e)return;const t={...e.params??{}};return"string"==typeof t.role&&(t.role=this.t.role[t.role]),fe(this.t[e.key],t)}issueFor(e){return this.issueText(this.issues.find(t=>t.field===e))}selectState(e){this.selectedState=e,this.pendingId=void 0,e&&this.narrow&&this.updateComplete.then(()=>this.renderRoot.querySelector("#state-editor")?.scrollIntoView?.({block:"start",behavior:"smooth"}))}addState(e){if(!this.draft)return;const t=this.t.newState,a=Se(ke(t),this.draft.state_tree.map(e=>e.id));this.change(s=>s.state_tree.push({id:a,name:t,parent:e,scene:"",default_child:null,occupied:null})),this.newIds.add(`state:${a}`),this.selectState(a),this.focusName("#state-name")}async focusName(e){await this.updateComplete;const t=this.renderRoot.querySelector(e);t?.focus(),t?.select()}patchState(e,t){this.change(a=>{const s=a.state_tree.find(t=>t.id===e);s&&Object.assign(s,t)})}renameStateName(e,t){if(!this.draft)return;let a=_e(this.draft);a.state_tree.find(t=>t.id===e).name=t;let s=e;if(this.newIds.has(`state:${e}`)&&!this.idTouched.has(`state:${e}`)){const i=a.state_tree.filter(t=>t.id!==e).map(e=>e.id),n=Se(ke(t||this.t.newState),i);n!==e&&(a=Re(a,e,n),this.newIds.delete(`state:${e}`),this.newIds.add(`state:${n}`),s=n)}this.edit(a),this.selectedState=s}idProblem(e,t,a=[]){return!be.test(e)||e.length>64?this.t.idInvalid:a.includes(e)?this.t.idReserved:t.includes(e)?this.t.idDuplicate:void 0}commitStateId(e,t){const a=this.draft.state_tree.filter(t=>t.id!==e).map(e=>e.id);this.idTouched.add(`state:${e}`),t!==e?this.idProblem(t,a)?this.pendingId=t:(this.edit(Re(this.draft,e,t)),this.newIds.delete(`state:${e}`),this.newIds.add(`state:${t}`),this.idTouched.add(`state:${t}`),this.selectedState=t,this.pendingId=void 0):this.pendingId=void 0}requestDeleteState(e){const t=this.draft.state_tree.filter(t=>t.id!==e);this.dialog={kind:"deleteState",id:e,replacement:t[0]?.id??""}}confirmDeleteState(e,t){this.edit(function(e,t,a){const s=Fe(e,t);if(s.blocked)throw new Error(s.blocked);const i=_e(e),n=i.state_tree.find(e=>e.id===t);i.state_tree=i.state_tree.filter(e=>e.id!==t);for(const e of i.state_tree)e.parent===t&&(e.parent=n.parent),e.default_child===t&&(e.default_child=null);for(const e of ye)i.roles[e]===t&&(i.roles[e]=null);for(const e of i.overlays)e.when_state?.includes(t)&&(e.when_state=e.when_state.filter(e=>e!==t));return i.initial_state===t&&(i.initial_state=a&&i.state_tree.some(e=>e.id===a)?a:i.state_tree[0].id),i}(this.draft,e,t)),this.newIds.delete(`state:${e}`),this.dialog=void 0,this.selectState(null)}addOverlay(){if(!this.draft)return;const e=this.t.newOverlay,t=Se(ke(e,"overlay"),[...this.draft.overlays.map(e=>e.id),...$e]);this.change(a=>a.overlays.push({id:t,name:e,scene:""})),this.newIds.add(`overlay:${t}`),this.selectOverlay(t),this.focusName("#overlay-name")}selectOverlay(e){this.selectedOverlay=e,this.pendingId=void 0,e&&this.narrow&&this.updateComplete.then(()=>this.renderRoot.querySelector("#overlay-editor")?.scrollIntoView?.({block:"start",behavior:"smooth"}))}replaceOverlay(e,t){this.change(a=>{const s=a.overlays.findIndex(t=>t.id===e);s>=0&&(a.overlays[s]=t)})}patchOverlay(e,t,a=[]){const s=this.draft.overlays.find(t=>t.id===e);if(!s)return;const i={..._e(s),...t};for(const e of a)delete i[e];this.replaceOverlay(e,i)}renameOverlayName(e,t){const a=`overlay:${e}`,s=[...this.draft.overlays.filter(t=>t.id!==e).map(e=>e.id),...$e],i=this.newIds.has(a)&&!this.idTouched.has(a)?Se(ke(t||this.t.newOverlay,"overlay"),s):e;this.patchOverlay(e,{name:t,id:i}),i!==e&&(this.newIds.delete(a),this.newIds.add(`overlay:${i}`),this.selectedOverlay=i)}commitOverlayId(e,t){const a=this.draft.overlays.filter(t=>t.id!==e).map(e=>e.id);this.idTouched.add(`overlay:${e}`),t!==e?this.idProblem(t,a,$e)?this.pendingId=t:(this.patchOverlay(e,{id:t}),this.newIds.delete(`overlay:${e}`),this.newIds.add(`overlay:${t}`),this.idTouched.add(`overlay:${t}`),this.selectedOverlay=t,this.pendingId=void 0):this.pendingId=void 0}render(){const e=this.t;return U`
      ${this.renderBar()}
      ${this.loading&&!this.draft?U`<div class="center-page">
              <div class="card empty" role="status">
                ${pe("spinner","spin")}<span>${e.loading}</span>
              </div>
            </div>`:this.loadError&&!this.draft?this.renderLoadError():this.draft?U`<main ?inert=${this.saving}>
                  ${this.renderBanner()}
                  ${this.narrow?this.renderAccordion():this.renderTabs()}
                </main>`:this.renderNotConfigured()}
      ${this.renderDialog()}
    `}renderBar(){const e=this.t,t=this.entries.find(e=>e.entry_id===this.entryId),a=this.issues.length;return U`
      <header class="bar">
        <div class="bar-title">
          ${this.narrow?U`<button
                  class="icon-btn"
                  aria-label=${e.menu}
                  @click=${this.toggleMenu}
                >
                  ${pe("menu")}
                </button>`:W}
          <div class="titles">
            <h1>${e.title}</h1>
            ${t&&this.entries.length<=1?U`<div class="subtitle">${t.title}</div>`:W}
          </div>
          ${this.entries.length>1?U`<select
                  class="entry-select"
                  aria-label=${e.entry}
                  ?disabled=${this.saving}
                  @change=${e=>{const t=e.target,a=t.value;t.value=this.entryId??"",this.chooseEntry(a)}}
                >
                  ${this.entries.map(e=>U`<option
                        value=${e.entry_id}
                        ?selected=${e.entry_id===this.entryId}
                      >
                        ${e.title}
                      </option>`)}
                </select>`:W}
        </div>
        ${this.draft?U`<div class="actions">
                <span class="status ${this.dirty?"dirty":""}" role="status">
                  ${this.saving?U`${pe("spinner","s spin")}${e.saving}`:this.dirty?U`<span class="dot"></span>${e.unsaved}${a?U` · <span class="count">${a}</span>`:W}`:e.allSaved}
                </span>
                <button
                  class="btn ghost"
                  data-action="discard"
                  ?disabled=${!this.dirty||this.saving}
                  @click=${()=>this.dialog={kind:"discard"}}
                >
                  ${e.discard}
                </button>
                <button
                  class="btn primary"
                  data-action="save"
                  ?disabled=${!this.dirty||this.saving}
                  @click=${()=>this.save()}
                >
                  ${this.saving?pe("spinner","s spin"):pe("check","s")}${e.save}
                </button>
              </div>`:W}
      </header>
    `}toggleMenu(){this.dispatchEvent(new Event("hass-toggle-menu",{bubbles:!0,composed:!0}))}renderLoadError(){const e=this.t;return U`<div class="center-page">
      <div class="card">
        <div class="banner error" role="alert">
          ${pe("warning")}
          <div class="text">
            <strong>${e.loadFailed}</strong
            ><span class="detail">${this.loadError}</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn primary" @click=${()=>this.load()}>
            ${e.retry}
          </button>
        </div>
      </div>
    </div>`}renderNotConfigured(){const e=this.t;return U`<div class="center-page">
      <div class="card empty">
        <span class="circ tone-neutral">${pe("home")}</span>
        <h2>${e.notConfiguredTitle}</h2>
        <p class="lead">${e.notConfiguredBody}</p>
        <a
          class="btn primary"
          href="/config/integrations/dashboard/add?domain=house_state"
          >${e.addIntegration}</a
        >
      </div>
    </div>`}renderBanner(){const e=this.t,t=this.banner;return t?"saved"===t.kind?U`<div class="banner success" role="status">
        ${pe("check")}
        <div class="text">${e.saved}</div>
        <button
          class="icon-btn"
          aria-label=${e.close}
          @click=${()=>this.banner=void 0}
        >
          ${pe("close","s")}
        </button>
      </div>`:"conflict"===t.kind?U`<div class="banner warn" role="alert">
        ${pe("warning")}
        <div class="text">${e.conflict}</div>
        <button
          class="btn"
          data-action="reload"
          @click=${()=>this.reloadAfterConflict()}
        >
          ${e.reloadDiscards}
        </button>
      </div>`:U`<div class="banner error" role="alert">
      ${pe("warning")}
      <div class="text">
        <strong
          >${"invalid"===t.kind?e.invalidTitle:e.saveFailed}</strong
        >
        <span class="detail" data-detail>${t.detail}</span>
      </div>
      <button
        class="icon-btn"
        aria-label=${e.close}
        @click=${()=>this.banner=void 0}
      >
        ${pe("close","s")}
      </button>
    </div>`:W}sectionCount(e){return this.issues.filter(t=>t.section===e).length}renderTabs(){const e=this.t;return U`
      <nav class="tabs" role="tablist" aria-label=${e.title}>
        ${ut.map(({id:t,icon:a})=>{const s=this.sectionCount(t);return U`<button
            class="tab"
            role="tab"
            id=${`tab-${t}`}
            data-section=${t}
            aria-selected=${this.section===t?"true":"false"}
            aria-controls="section"
            @click=${()=>this.section=t}
          >
            ${pe(a,"s")}${e.sections[t]}${s?U`<span class="count">${s}</span>`:W}
          </button>`})}
      </nav>
      <section
        id="section"
        role="tabpanel"
        aria-labelledby=${`tab-${this.section}`}
      >
        ${this.renderSection(this.section)}
      </section>
    `}renderAccordion(){const e=this.t;return U`<div class="accordion">
      ${ut.map(({id:t,icon:a})=>{const s=this.section===t,i=this.sectionCount(t);return U`<div class="acc ${s?"open":""}" data-section=${t}>
          <button
            class="acc-head"
            aria-expanded=${s?"true":"false"}
            @click=${()=>this.section=s?"":t}
          >
            <span class="circ sm tone-neutral">${pe(a,"s")}</span>
            <span class="acc-text">
              <span class="acc-title">${e.sections[t]}</span>
              <span class="acc-hint">${e.sectionHints[t]}</span>
            </span>
            ${i?U`<span class="count">${i}</span>`:W}
            <span class="chev">${pe("chevron")}</span>
          </button>
          ${s?U`<div class="acc-body">${this.renderSection(t)}</div>`:W}
        </div>`})}
    </div>`}renderSection(e){switch(e){case"states":return this.renderStates();case"overlays":return this.renderOverlays();case"presence":return this.renderPresence();case"night":return this.renderNight();case"visits":return this.renderVisits();case"water":return this.renderWater();case"advanced":return this.renderAdvanced();default:return W}}renderStates(){const e=this.t,t=this.draft,a=t.state_tree.find(e=>e.id===this.selectedState);return U`<div class="split">
      <div class="column">
        <div class="card">
          <div class="card-head">
            <div class="grow">
              <h2>${e.tree}</h2>
            </div>
            <button
              class="btn"
              data-action="add-root"
              @click=${()=>this.addState(null)}
            >
              ${pe("plus","s")}${e.addTopLevel}
            </button>
          </div>
          <p class="lead">${e.treeHint}</p>
          <ul class="tree" role="list">
            ${De(t.state_tree).map(({node:e,depth:t})=>this.renderNode(e,t))}
          </ul>
        </div>
      </div>
      <div class="column sticky">
        ${a?this.renderStateEditor(a):this.narrow?W:U`<div class="card empty">
                  ${pe("tree")}<span>${e.selectState}</span>
                </div>`}
        ${this.renderRoles()}
      </div>
    </div>`}renderNode(e,t){const a=this.t,s=this.draft,i=Ee(s.state_tree,e.id),n=s.state_tree.find(t=>t.id===e.parent),r=n?.default_child===e.id,o=ye.filter(t=>s.roles[t]===e.id),l=Ne(s.state_tree,e.id),d=s.state_tree.indexOf(e),c=this.issues.some(e=>e.field.startsWith(`state:${d}:`)||e.field.startsWith("role:")&&o.includes(e.field.slice(5))),h=l?l.source===e.id?rt(this.hass?.states,l.scene):fe(a.sceneInherits,{scene:rt(this.hass?.states,l.scene),name:this.stateLabel(l.source)}):a.noScene;return U`<li>
      <button
        class="node"
        data-node=${e.id}
        aria-current=${this.selectedState===e.id?"true":"false"}
        @click=${()=>this.selectState(e.id)}
      >
        ${t?U`<span class="indent">${Array.from({length:t},()=>U`<span class="guide"></span>`)}</span>`:W}
        <span class="circ sm ${i.value?"tone-home":"tone-away"}"
          >${pe(he(e.id),"s")}</span
        >
        <span class="node-main">
          <span class="node-name"
            >${this.stateName(e)}<span class="node-id mono"
              >${e.id}</span
            ></span
          >
          <span class="node-meta">
            <span
              class=${i.value?"tone-home":"tone-away"}
              data-occupancy=${i.inherited?"inherited":"explicit"}
            >
              <span class="occ ${i.inherited?"inherited":""}"></span>
              ${i.value?a.someoneHome:a.nobodyHome}${i.inherited?U` · ${a.inherited}`:W}
            </span>
            <span class=${l?.source===e.id?"":"muted"}
              >${pe("overlay","xs")}${h}</span
            >
          </span>
        </span>
        <span class="badges">
          ${s.initial_state===e.id?U`<span class="badge start" data-badge="initial">${a.initialBadge}</span>`:W}
          ${r?U`<span
                  class="badge outline tone-neutral"
                  data-badge="default"
                  title=${fe(a.defaultOf,{name:this.stateName(n)})}
                >
                  ${pe("star","xs")}${a.defaultBadge}</span
                >`:W}
          ${o.map(e=>U`<span class="badge role" data-badge=${`role-${e}`}>${a.role[e]}</span>`)}
          ${c?U`<span class="badge error">${pe("warning","xs")}</span>`:W}
        </span>
      </button>
    </li>`}renderStateEditor(e){const t=this.t,a=this.draft,s=a.state_tree.indexOf(e),i=this.newIds.has(`state:${e.id}`),n=Oe(a.state_tree,e.id),r=a.state_tree.find(t=>t.id===e.parent),o=Ee(a.state_tree,e.id),l=e.scene?null:Ne(a.state_tree,e.id),d=a.state_tree.filter(t=>t.id!==e.id).map(e=>e.id),c=void 0!==this.pendingId?this.idProblem(this.pendingId,d):this.issueFor(`state:${s}:id`),h=null===e.occupied?"inherit":e.occupied?"home":"away",p=null===e.occupied?o.source?`${o.value?t.someoneHome:t.nobodyHome} · ${fe(t.inheritsFrom,{name:this.stateLabel(o.source)})}`:t.inheritedDefault:void 0;return U`<div class="card" id="state-editor" data-editor="state">
      <div class="card-head">
        <span class="circ ${o.value?"tone-home":"tone-away"}"
          >${pe(he(e.id))}</span
        >
        <div class="grow">
          <div class="label">${t.editState}</div>
          <h2>${this.stateName(e)}</h2>
        </div>
        <button
          class="icon-btn"
          aria-label=${t.close}
          @click=${()=>this.selectState(null)}
        >
          ${pe("close","s")}
        </button>
      </div>
      <div class="fields">
        ${Xe({id:"state-name",label:t.name,value:this.stateName(e),maxlength:100,error:this.issueFor(`state:${s}:name`),onInput:t=>this.renameStateName(e.id,t)})}
        ${Xe(i?{id:"state-id",label:t.id,mono:!0,value:this.pendingId??e.id,hint:t.idHint,error:c,onInput:t=>{this.pendingId=t,this.idTouched.add(`state:${e.id}`)},onChange:t=>this.commitStateId(e.id,t.trim())}:{id:"state-id",label:t.id,mono:!0,value:e.id,readonly:!0,hint:t.idFixed})}
        ${Ye({id:"state-parent",label:t.parent,value:e.parent??"",options:[{value:"",label:t.topLevel},...this.stateOptions(Ce(a.state_tree,e.id))],hint:r?.default_child===e.id?fe(t.movesDefault,{name:this.stateName(r)}):void 0,onChange:t=>this.edit(function(e,t,a){const s=_e(e);if(a&&Ce(s.state_tree,t).has(a))return e;for(const e of s.state_tree)e.id===t?e.parent=a:e.default_child===t&&e.id!==a&&(e.default_child=null);return s}(a,e.id,t||null))})}
        ${Ye({id:"state-default",label:t.defaultChild,value:e.default_child??"",options:[{value:"",label:t.noDefaultChild},...n.map(e=>({value:e.id,label:`${this.stateName(e)} (${e.id})`}))],hint:n.length?void 0:t.noChildren,onChange:t=>this.patchState(e.id,{default_child:t||null})})}
        ${it({hass:this.hass,strings:t,name:"state-scene",label:t.scene,domains:["scene"],value:e.scene,hint:e.scene?void 0:l?fe(t.sceneInherits,{scene:rt(this.hass?.states,l.scene),name:this.stateLabel(l.source)}):t.sceneNone,error:e.scene&&!this.hass?.states?.[e.scene]?t.sceneMissing:void 0,onChange:t=>this.patchState(e.id,{scene:t||""})})}
        ${tt({label:t.occupancy,name:"occupied",value:h,options:[{value:"inherit",label:t.inherit},{value:"home",label:t.someoneHome},{value:"away",label:t.nobodyHome}],hint:p,onChange:t=>this.patchState(e.id,{occupied:"inherit"===t?null:"home"===t})})}
      </div>
      <div class="editor-foot">
        <button
          class="btn"
          data-action="add-child"
          @click=${()=>this.addState(e.id)}
        >
          ${pe("plus","s")}${t.addChild}
        </button>
        <button
          class="btn danger"
          data-action="delete-state"
          @click=${()=>this.requestDeleteState(e.id)}
        >
          ${pe("trash","s")}${t.deleteState}
        </button>
      </div>
    </div>`}renderRoles(){const e=this.t,t=this.draft,a=this.stateOptions();return U`<div class="card" data-card="roles">
      <div class="card-head">
        <span class="circ sm tone-neutral">${pe("flag","s")}</span>
        <div class="grow"><h2>${e.roles}</h2></div>
      </div>
      <p class="lead">${e.rolesHint}</p>
      <div class="fields">
        ${Ye({id:"initial-state",label:e.initialState,value:t.initial_state,options:a,hint:e.initialHint,error:t.state_tree.some(e=>e.id===t.initial_state)?void 0:fe(e.roleMissing,{role:e.initialState}),onChange:e=>this.change(t=>t.initial_state=e)})}
        <div class="grid2">
          ${ye.map(s=>{const i=t.roles[s],n=i&&"missing"!==Te(t,s)?He(t.state_tree,i):null;return Ye({id:`role-${s}`,label:e.role[s],value:i??"",options:[{value:"",label:e.roleOff},...a],hint:n&&n!==i?fe(e.leadsTo,{name:this.stateLabel(n)}):void 0,error:this.issueFor(`role:${s}`),onChange:e=>this.change(t=>t.roles[s]=e||null)})})}
        </div>
      </div>
    </div>`}renderOverlays(){const e=this.t,t=this.draft,a=t.overlays.find(e=>e.id===this.selectedOverlay);return U`<div class="split">
      <div class="column">
        <div class="card">
          <div class="card-head">
            <div class="grow"><h2>${e.sections.overlays}</h2></div>
            <button
              class="btn"
              data-action="add-overlay"
              @click=${()=>this.addOverlay()}
            >
              ${pe("plus","s")}${e.addOverlay}
            </button>
          </div>
          <p class="lead">${e.overlaysHint}</p>
          ${t.overlays.length?U`<ul class="tree" role="list">
                  ${t.overlays.map((e,t)=>this.renderOverlayRow(e,t))}
                </ul>`:U`<div class="empty">${e.noOverlays}</div>`}
        </div>
      </div>
      <div class="column sticky">
        ${a?this.renderOverlayEditor(a):this.narrow?W:U`<div class="card empty">
                  ${pe("overlay")}<span>${e.selectOverlay}</span>
                </div>`}
      </div>
    </div>`}renderOverlayRow(e,t){const a=this.t,s=this.summaryContext,i=function(e,t){const{strings:a}=t,s=[];if(!0===e.when_occupied&&s.push(a.sumHome),!1===e.when_occupied&&s.push(a.sumAway),e.when_state?.length){const i=e.when_state.map(e=>{const s=t.tree.find(t=>t.id===e);return s?ge(a,s,"starterStates"):e});s.push(fe(a.sumStates,{states:i.join(", ")}))}return s}(e,s),n=this.issues.some(e=>e.field.startsWith(`overlay:${t}:`));return U`<li>
      <button
        class="item"
        data-overlay=${e.id}
        aria-current=${this.selectedOverlay===e.id?"true":"false"}
        @click=${()=>this.selectOverlay(e.id)}
      >
        <span
          class="circ sm ${"manual"===ze(e)?"tone-neutral":"tone-overlay"}"
          >${pe("manual"===ze(e)?"overlay":"calendar","s")}</span
        >
        <span class="node-main">
          <span class="node-name"
            >${this.overlayName(e)}<span class="node-id mono"
              >${e.id}</span
            ></span
          >
          <span class="node-meta"
            ><span data-summary>${ht(e,s)}</span></span
          >
          ${i.length?U`<span class="node-meta"
                  ><span data-conditions>${i.join(" · ")}</span></span
                >`:W}
          <span class="node-meta">
            <span class=${e.scene?"":"muted"}
              >${pe("overlay","xs")}${e.scene?rt(this.hass?.states,e.scene):a.noScene}</span
            >
          </span>
        </span>
        <span class="badges">
          ${e.priority?U`<span class="badge role"
                  >${fe(a.sumPriority,{priority:lt(e.priority,this.locale)})}</span
                >`:W}
          ${n?U`<span class="badge error">${pe("warning","xs")}</span>`:W}
        </span>
      </button>
    </li>`}renderOverlayEditor(e){const t=this.t,a=this.draft,s=a.overlays.indexOf(e),i=e=>this.issueFor(`overlay:${s}:${e}`),n=this.newIds.has(`overlay:${e.id}`),r=a.overlays.filter(t=>t.id!==e.id).map(e=>e.id),o=void 0!==this.pendingId?this.idProblem(this.pendingId,r,$e):i("id"),l=ze(e),d=!0===e.when_occupied?"home":!1===e.when_occupied?"away":"any",c=new Set(e.when_state??[]);return U`<div class="card" id="overlay-editor" data-editor="overlay">
      <div class="card-head">
        <span class="circ tone-overlay">${pe("overlay")}</span>
        <div class="grow">
          <div class="label">${t.editOverlay}</div>
          <h2>${this.overlayName(e)}</h2>
        </div>
        <button
          class="icon-btn"
          aria-label=${t.close}
          @click=${()=>this.selectOverlay(null)}
        >
          ${pe("close","s")}
        </button>
      </div>
      <div class="fields">
        ${Xe({id:"overlay-name",label:t.name,value:this.overlayName(e),maxlength:100,error:i("name"),onInput:t=>this.renameOverlayName(e.id,t)})}
        ${Xe(n?{id:"overlay-id",label:t.id,mono:!0,value:this.pendingId??e.id,hint:t.idHint,error:o,onInput:t=>{this.pendingId=t,this.idTouched.add(`overlay:${e.id}`)},onChange:t=>this.commitOverlayId(e.id,t.trim())}:{id:"overlay-id",label:t.id,mono:!0,value:e.id,readonly:!0,hint:t.idFixed})}
        <div class="row-fields">
          <div style="flex: 3 1 220px; min-width: 0">
            ${it({hass:this.hass,strings:t,name:"overlay-scene",label:t.scene,domains:["scene"],value:e.scene,error:e.scene&&!this.hass?.states?.[e.scene]?t.sceneMissing:void 0,onChange:t=>this.patchOverlay(e.id,{scene:t||""})})}
          </div>
          ${Qe({id:"overlay-priority",label:t.priority,value:e.priority??0,min:-100,max:100,compact:!0,hint:t.priorityHint,onChange:t=>this.patchOverlay(e.id,{priority:Math.max(-100,Math.min(100,Math.round(t)))})})}
        </div>
        <div class="divider"></div>
        ${tt({label:t.activation,name:"activation",value:l,options:[{value:"manual",label:t.manual},{value:"calendar",label:t.calendar},{value:"dates",label:t.dates}],onChange:t=>this.replaceOverlay(e.id,function(e,t){const a=_e(e);return"calendar"!==t&&(delete a.calendar,delete a.match),"dates"!==t&&delete a.dates,"calendar"===t&&void 0===a.calendar&&(a.calendar=""),"dates"!==t||a.dates||(a.dates=Ue("fixed")),a}(e,t))})}
        ${"calendar"===l?this.renderCalendarRule(e,i):W}
        ${"dates"===l&&e.dates?this.renderDateRule(e,e.dates,i):W}
        ${"manual"!==l?U`<div class="preview" data-preview>
                ${ht(e,this.summaryContext)}
              </div>`:W}
        <div class="divider"></div>
        <h3>${t.conditions}</h3>
        ${tt({label:t.whenOccupied,name:"when_occupied",value:d,options:[{value:"any",label:t.any},{value:"home",label:t.someoneHome},{value:"away",label:t.nobodyHome}],onChange:t=>"any"===t?this.patchOverlay(e.id,{},["when_occupied"]):this.patchOverlay(e.id,{when_occupied:"home"===t})})}
        <div class="field">
          <span class="label" id="when-state-label">${t.whenState}</span>
          <div
            class="segment pills-multi"
            role="group"
            aria-labelledby="when-state-label"
          >
            ${De(a.state_tree).map(({node:t})=>U`<button
                  type="button"
                  class="pill ${c.has(t.id)?"active":""}"
                  data-when=${t.id}
                  aria-pressed=${c.has(t.id)?"true":"false"}
                  @click=${()=>{const a=c.has(t.id)?(e.when_state??[]).filter(e=>e!==t.id):[...e.when_state??[],t.id];a.length?this.patchOverlay(e.id,{when_state:a}):this.patchOverlay(e.id,{},["when_state"])}}
                >
                  ${c.has(t.id)?pe("check","s"):W}${this.stateName(t)}
                </button>`)}
          </div>
          ${Ze(t.whenStateHint)}
        </div>
      </div>
      <div class="editor-foot">
        <span></span>
        <button
          class="btn danger"
          data-action="delete-overlay"
          @click=${()=>this.dialog={kind:"deleteOverlay",id:e.id}}
        >
          ${pe("trash","s")}${t.deleteOverlay}
        </button>
      </div>
    </div>`}renderCalendarRule(e,t){const a=this.t;return U`
      ${it({hass:this.hass,strings:a,name:"overlay-calendar",label:a.calendarEntity,domains:["calendar"],value:e.calendar??"",error:t("calendar"),onChange:t=>this.patchOverlay(e.id,{calendar:t||""})})}
      ${Xe({id:"overlay-match",label:a.match,mono:!0,value:e.match??"",hint:a.matchHint,error:t("match"),onChange:t=>t?this.patchOverlay(e.id,{match:t}):this.patchOverlay(e.id,{},["match"])})}
    `}monthOptions(){return this.t.months.map((e,t)=>({value:String(t+1),label:e}))}dayMonthFields(e,t,a,s,i=""){const n=this.t,[r,o]=Be(t);return U`<div
      class="field"
      role="group"
      aria-label=${e}
      data-mmdd=${i}
    >
      <span class="label">${e}</span>
      <div class="row-fields">
        ${Ye({label:`${e}: ${n.month}`,hideLabel:!0,value:String(r),compact:!0,options:this.monthOptions(),onChange:e=>a(je(Number(e),o))})}
        ${Qe({label:`${e}: ${n.day}`,hideLabel:!0,value:o,min:1,max:31,compact:!0,onChange:e=>a(je(r,Math.max(1,Math.min(31,Math.round(e)))))})}
      </div>
      ${Ze(void 0,s)}
    </div>`}renderDateRule(e,t,a){const s=this.t,i=t=>this.patchOverlay(e.id,{dates:t}),n=tt({label:s.dateKind,name:"date-kind",value:t.type,options:[{value:"fixed",label:s.fixed},{value:"easter",label:s.easter},{value:"nth_weekday",label:s.nthWeekday}],onChange:e=>i(Ue(e))});if("fixed"===t.type)return U`${n}
        <div class="grid2">
          ${this.dayMonthFields(s.from,t.from,e=>i({...t,from:e}),a("from"),"from")}
          ${this.dayMonthFields(s.to,t.to,e=>i({...t,to:e}),a("to"),"to")}
        </div>`;if("easter"===t.type)return U`${n}
        <div class="grid2">
          ${Qe({id:"easter-from",label:s.easterFrom,value:t.from,min:-180,max:180,onChange:e=>i({...t,from:Math.round(e)})})}
          ${Qe({id:"easter-to",label:s.easterTo,value:t.to,min:-180,max:180,onChange:e=>i({...t,to:Math.round(e)})})}
        </div>
        ${Ze(s.easterHint,a("easter"))}`;const r=void 0!==t.anchor,o=r?[1,2,3,4,5]:[1,2,3,4,5,-1,-2,-3,-4,-5],l=r?s.ordinalAnchor:s.ordinal,d=e=>({...t,...e});return U`${n}
      ${tt({label:s.countFrom,name:"anchor-kind",value:r?"anchor":"month",options:[{value:"month",label:s.inMonth},{value:"anchor",label:s.fromDate}],onChange:e=>{const a={...t,nth:Math.abs(t.nth)||1};delete a.month,delete a.anchor,"anchor"===e?a.anchor="12-25":a.month=1,i(a)}})}
      <div class="row-fields">
        ${Ye({id:"nth",label:s.occurrence,value:String(r?Math.abs(t.nth):t.nth),compact:!0,options:o.map(e=>({value:String(e),label:l[String(e)]})),onChange:e=>{const a=Number(e);i(d({nth:r&&t.nth<0?-a:a}))}})}
        ${Ye({id:"weekday",label:s.weekday,value:t.weekday,compact:!0,options:xe.map(e=>({value:e,label:s.weekdays[e]})),onChange:e=>i(d({weekday:e}))})}
        ${Ye(r?{id:"before-after",label:s.direction,value:t.nth<0?"before":"after",compact:!0,options:[{value:"before",label:s.before},{value:"after",label:s.after}],onChange:e=>i(d({nth:("before"===e?-1:1)*Math.abs(t.nth)}))}:{id:"month",label:s.month,value:String(t.month??1),compact:!0,options:this.monthOptions(),onChange:e=>i(d({month:Number(e)}))})}
      </div>
      ${r?this.dayMonthFields(s.anchor,t.anchor,e=>i(d({anchor:e})),a("anchor"),"anchor"):W}
      ${Qe({id:"days",label:s.lasts,value:t.days,min:1,max:366,error:a("days"),onChange:e=>i(d({days:Math.round(e)}))})}`}renderPresence(){const e=this.t,t=this.draft,a=(e,t)=>this.change(a=>a[e]=t);return U`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-home">${pe("home","s")}</span>
          <div class="grow"><h2>${e.sections.presence}</h2></div>
        </div>
        <p class="lead">${e.presenceHint}</p>
        <div class="fields">
          ${it({hass:this.hass,strings:e,name:"door_entities",label:e.doors,domains:["lock"],multiple:!0,value:t.door_entities,onChange:e=>a("door_entities",e)})}
          ${it({hass:this.hass,strings:e,name:"gate_entities",label:e.gates,domains:["cover"],multiple:!0,value:t.gate_entities,onChange:e=>a("gate_entities",e)})}
          ${it({hass:this.hass,strings:e,name:"person_entities",label:e.people,domains:["person"],multiple:!0,value:t.person_entities,onChange:e=>a("person_entities",e)})}
        </div>
      </div>
      <div class="card">
        <div class="fields">
          ${at({id:"auto_return",label:e.autoReturn,hint:e.autoReturnHint,checked:t.auto_return,onChange:e=>a("auto_return",e)})}
          ${et({id:"arrival_delay",label:e.arrivalDelay,seconds:t.arrival_delay,units:["s"],strings:e,hint:e.arrivalDelayHint,error:this.issueFor("arrival_delay"),onChange:e=>a("arrival_delay",e)})}
          <div class="divider"></div>
          ${at({id:"auto_away",label:e.autoAway,hint:e.autoAwayHint,checked:t.auto_away,onChange:e=>a("auto_away",e)})}
          ${et({id:"auto_away_grace",label:e.awayGrace,seconds:t.auto_away_grace,units:["m","s"],strings:e,disabled:!t.auto_away,error:this.issueFor("auto_away_grace"),onChange:e=>a("auto_away_grace",e)})}
        </div>
      </div>
    </div>`}renderNight(){const e=this.t,t=this.draft,a=t.night_schedule,s=e=>this.change(t=>t.night_schedule=e),i="sun"===a.type?Math.abs(a.offset/60):0;return U`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-home">${pe("night","s")}</span>
          <div class="grow"><h2>${e.sections.night}</h2></div>
        </div>
        <p class="lead">${e.nightHint}</p>
        ${t.roles.night?W:U`<div class="note" role="note">
                ${pe("warning","s")}<span>${e.nightRoleOff}</span>
              </div>`}
        <div class="fields">
          ${tt({label:e.schedule,name:"night-type",value:a.type,options:[{value:"off",label:e.off},{value:"fixed",label:e.fixedTime},{value:"sun",label:e.sun}],onChange:e=>s("off"===e?{type:"off"}:"fixed"===e?{type:"fixed",time:"22:00:00"}:{type:"sun",event:"sunset",offset:0})})}
          ${"fixed"===a.type?U`<label class="field">
                  <span class="label">${e.time}</span>
                  <input
                    id="night-time"
                    type="time"
                    step="1"
                    aria-invalid=${this.issueFor("night_time")?"true":"false"}
                    .value=${a.time}
                    @change=${e=>{const t=e.target.value;s({type:"fixed",time:/^\d{2}:\d{2}$/.test(t)?`${t}:00`:t})}}
                  />
                  ${Ze(void 0,this.issueFor("night_time"))}
                </label>`:W}
          ${"sun"===a.type?U`${tt({label:e.sunEvent,name:"sun-event",value:a.event,options:[{value:"sunset",label:e.sunset},{value:"sunrise",label:e.sunrise}],onChange:e=>s({...a,event:e})})}
                  <div class="row-fields">
                    ${Qe({id:"night-offset",label:e.offset,value:i,min:0,max:1440,step:"any",unit:e.minutes,compact:!0,error:this.issueFor("night_offset"),onChange:e=>s({...a,offset:(a.offset<0?-1:1)*Ve(Math.abs(e))})})}
                    ${Ye({id:"night-direction",label:e.direction,value:a.offset<0?"before":"after",compact:!0,options:[{value:"before",label:e.before},{value:"after",label:e.after}],onChange:e=>s({...a,offset:("before"===e?-1:1)*Math.abs(a.offset)})})}
                  </div>`:W}
          <div class="preview" data-preview="night">
            ${function(e,t){const{strings:a,locale:s}=t;if("fixed"===e.type)return fe(a.nightAt,{time:dt(e.time,s,t.timeFormat)});if("sun"===e.type){const t=("sunrise"===e.event?a.sunrise:a.sunset).toLowerCase();return e.offset?fe(e.offset<0?a.nightSunBefore:a.nightSunAfter,{event:t,offset:pt(a,e.offset,s)}):fe(a.nightSunExact,{event:t})}return a.nightOff}(a,this.summaryContext)}
          </div>
        </div>
      </div>
    </div>`}renderVisits(){const e=this.t,t=this.draft,a=(e,t)=>this.change(a=>a[e]=t),s=fe(e.outOfRange,{min:`${lt(this.limits.min_duration/60,this.locale)} ${e.minutes}`,max:`${(e=>lt(e/3600,this.locale,{maximumFractionDigits:2}))(this.limits.max_duration)} ${e.hours}`});return U`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${pe("guest","s")}</span>
          <div class="grow"><h2>${e.sections.visits}</h2></div>
        </div>
        <p class="lead">${e.visitsHint}</p>
        <div class="fields">
          <div class="grid2">
            ${et({id:"visit_duration",label:e.visitDuration,seconds:t.visit_duration,units:["h","m"],strings:e,error:this.issueFor("visit_duration"),onChange:e=>a("visit_duration",e)})}
            ${et({id:"visit_max_duration",label:e.visitMax,seconds:t.visit_max_duration,units:["h","m"],strings:e,hint:s,error:this.issueFor("visit_max_duration"),onChange:e=>a("visit_max_duration",e)})}
          </div>
          ${et({id:"visit_exit_grace",label:e.exitGrace,seconds:t.visit_exit_grace,units:["m","s"],strings:e,error:this.issueFor("visit_exit_grace"),onChange:e=>a("visit_exit_grace",e)})}
          ${at({id:"visit_reapply_scene",label:e.reapply,hint:e.reapplyHint,checked:t.visit_reapply_scene,onChange:e=>a("visit_reapply_scene",e)})}
          ${it({hass:this.hass,strings:e,name:"visit_lock_entities",label:e.visitLocks,domains:["lock"],multiple:!0,value:t.visit_lock_entities,onChange:e=>a("visit_lock_entities",e)})}
        </div>
      </div>
    </div>`}renderWater(){const e=this.t,t=this.draft;return U`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${pe("water","s")}</span>
          <div class="grow"><h2>${e.sections.water}</h2></div>
        </div>
        <p class="lead">${e.waterHint}</p>
        ${t.roles.vacation||!t.water_valves.length?W:U`<div class="note" role="note">
                ${pe("warning","s")}<span>${e.waterRoleOff}</span>
              </div>`}
        ${it({hass:this.hass,strings:e,name:"water_valves",label:e.valves,domains:["valve","switch"],multiple:!0,value:t.water_valves,onChange:e=>this.change(t=>t.water_valves=e)})}
      </div>
    </div>`}renderAdvanced(){const e=this.t,t=this.draft,a=(e,t)=>this.change(a=>{t?a.legacy_mirror[e]=t:delete a.legacy_mirror[e]});return U`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${pe("advanced","s")}</span>
          <div class="grow"><h2>${e.legacy}</h2></div>
        </div>
        <p class="lead">${e.legacyHint}</p>
        <div class="fields">
          ${it({hass:this.hass,strings:e,name:"legacy-state",label:e.legacyState,domains:["input_select"],value:t.legacy_mirror.state??"",onChange:e=>a("state",e)})}
          ${it({hass:this.hass,strings:e,name:"legacy-overlay",label:e.legacyOverlay,domains:["input_select"],value:t.legacy_mirror.overlay??"",onChange:e=>a("overlay",e)})}
        </div>
      </div>
    </div>`}renderDialog(){const e=this.dialog;if(!e)return W;const t=this.t;let a;if("deleteState"===e.kind)a=this.renderDeleteState(e);else if("deleteOverlay"===e.kind){const s=this.draft.overlays.find(t=>t.id===e.id);a=this.dialogFrame(fe(t.deleteOverlayTitle,{name:this.overlayName(s)}),"trash",U`<p class="lead">${t.deleteOverlayBody}</p>`,U`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${()=>{this.change(t=>t.overlays=t.overlays.filter(t=>t.id!==e.id)),this.newIds.delete(`overlay:${e.id}`),this.dialog=void 0,this.selectOverlay(null)}}
        >
          ${t.delete}
        </button>`)}else a="warnings"===e.kind?this.dialogFrame(t.warningsTitle,"warning",U`<p class="lead">${t.warningsBody}</p>
          <ul class="effects" data-warnings>
            ${e.warnings.map(e=>U`<li>${pe("warning","s")}<span class="mono">${e}</span></li>`)}
          </ul>`,U`<button
          class="btn primary"
          data-action="confirm"
          @click=${()=>this.save(!0)}
        >
          ${t.saveAnyway}
        </button>`):"discard"===e.kind?this.dialogFrame(t.discardTitle,"warning",U`<p class="lead">${t.discardBody}</p>`,U`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${()=>this.discard()}
        >
          ${t.discard}
        </button>`):this.dialogFrame(t.leaveTitle,"warning",U`<p class="lead">${t.leaveBody}</p>`,U`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${()=>this.switchEntry(e.entryId)}
        >
          ${t.discard}
        </button>`);return U`<div
      class="scrim"
      @click=${e=>e.target===e.currentTarget&&(this.dialog=void 0)}
      @keydown=${e=>"Escape"===e.key&&(this.dialog=void 0)}
    >
      ${a}
    </div>`}dialogFrame(e,t,a,s){const i=this.t;return U`<div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div class="dialog-head">
        <span
          class="circ ${"trash"===t?"tone-away":"tone-overlay"}"
          >${pe(t)}</span
        >
        <h2 id="dialog-title">${e}</h2>
      </div>
      ${a}
      <div class="dialog-actions">
        <button
          class="btn ghost"
          data-action="cancel"
          @click=${()=>this.dialog=void 0}
        >
          ${i.cancel}
        </button>
        ${s}
      </div>
    </div>`}renderDeleteState(e){const t=this.t,a=this.draft,s=a.state_tree.find(t=>t.id===e.id),i=this.stateName(s),n=Fe(a,e.id);if(n.blocked){const e=n.blockingOverlays.map(e=>this.overlayName(e)).join(", ");return this.dialogFrame(fe(t.deleteTitle,{name:i}),"trash",U`<div class="note" role="alert" data-blocked=${n.blocked}>
            ${pe("warning","s")}<span
              >${"last"===n.blocked?t.deleteBlockedLast:fe(t.deleteBlockedOverlay,{names:e})}</span
            >
          </div>
          ${n.blockingOverlays.length?U`<div class="toolbar-row">
                  ${n.blockingOverlays.map(e=>U`<button
                        class="btn"
                        @click=${()=>{this.dialog=void 0,this.section="overlays",this.selectOverlay(e.id)}}
                      >
                        ${fe(t.openOverlay,{name:this.overlayName(e)})}
                      </button>`)}
                </div>`:W}`,W)}const r=e=>e.map(e=>this.stateName(e)).join(", "),o=[U`<li>
        ${pe("trash","s")}<span>${fe(t.deleteRemove,{name:i})}</span>
      </li>`];n.reparented.length&&o.push(U`<li>
          ${pe("tree","s")}<span
            >${n.newParent?fe(t.deleteReparent,{names:r(n.reparented),parent:this.stateName(n.newParent)}):fe(t.deleteReparentRoot,{names:r(n.reparented)})}</span
          >
        </li>`);for(const e of n.defaultCleared)o.push(U`<li>
          ${pe("star","s")}<span
            >${fe(t.deleteDefault,{name:this.stateName(e)})}</span
          >
        </li>`);for(const e of n.rolesCleared)o.push(U`<li>
          ${pe("flag","s")}<span
            >${fe(t.deleteRole,{role:t.role[e]})}</span
          >
        </li>`);for(const e of n.overlaysTrimmed)o.push(U`<li>
          ${pe("overlay","s")}<span
            >${fe(t.deleteWhenState,{name:this.overlayName(e)})}</span
          >
        </li>`);return this.dialogFrame(fe(t.deleteTitle,{name:i}),"trash",U`<p class="lead">${t.deleteIntro}</p>
        <ul class="effects" data-effects>
          ${o}
        </ul>
        ${n.needsInitial?Ye({id:"replacement",label:t.deleteInitial,value:e.replacement,options:this.stateOptions(new Set([e.id])),onChange:t=>this.dialog={kind:"deleteState",id:e.id,replacement:t}}):W}`,U`<button
        class="btn danger solid"
        data-action="confirm"
        @click=${()=>this.confirmDeleteState(e.id,e.replacement)}
      >
        ${t.delete}
      </button>`)}async firstUpdated(){this.addEventListener("keydown",e=>{"Escape"===e.key&&this.dialog&&(this.dialog=void 0)})}willUpdate(e){e.has("dialog")&&this.dialog&&this.updateComplete.then(()=>this.renderRoot.querySelector(".dialog .btn.ghost")?.focus())}}mt.styles=nt,mt.properties={hass:{attribute:!1},narrow:{type:Boolean,reflect:!0},route:{attribute:!1},panel:{attribute:!1},loading:{state:!0},loadError:{state:!0},entries:{state:!0},entryId:{state:!0},saved:{state:!0},draft:{state:!0},section:{state:!0},selectedState:{state:!0},selectedOverlay:{state:!0},pendingId:{state:!0},saving:{state:!0},banner:{state:!0},dialog:{state:!0}},customElements.get("house-state-panel")||customElements.define("house-state-panel",mt);export{mt as HouseStatePanel};
