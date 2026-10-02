export const PRESETS={badge:[['58 mm 吧唧',58,58],['75 mm 吧唧',75,75],['44 mm 吧唧',44,44]],photo:[['标准拍立得 · 54 × 86',54,86],['宽幅拍立得 · 86 × 108',86,108]],sticker:[['方形贴纸 · 50 × 50',50,50],['长方形贴纸 · 50 × 70',50,70]]};
export const defaults=()=>({type:'badge',width:58,height:58,bleed:3,safe:3,scale:100,rotation:0,x:0,y:0,background:'#dff7ee',borderColor:'#ffffff',border:0,caption:'',fontSize:4,textColor:'#173c36',textY:82,dpi:300,quantity:1,paper:'a4',paperWidth:210,paperHeight:297,margin:10,gap:3});
export const mmToPx=(mm,dpi)=>Math.round(mm*dpi/25.4);
export function validateSettings(input){
 const s={...defaults(),...input};
 if(!['badge','photo','sticker'].includes(s.type))throw Error('不支持的谷子类型');
 const bounds={width:[10,200],height:[10,200],bleed:[0,10],safe:[0,15],scale:[50,400],rotation:[-180,180],x:[-100,100],y:[-100,100],border:[0,6],fontSize:[1,20],textY:[0,100],dpi:[150,600],quantity:[1,100],paperWidth:[50,500],paperHeight:[50,500],margin:[0,30],gap:[0,20]};
 for(const[k,[lo,hi]]of Object.entries(bounds)){if(typeof s[k]!=='number'||!Number.isFinite(s[k])||s[k]<lo||s[k]>hi)throw Error(`参数 ${k} 超出有效范围`);}
 if(![150,300,600].includes(s.dpi)||!Number.isInteger(s.quantity))throw Error('分辨率或数量无效');
 if(!['a4','custom'].includes(s.paper))throw Error('纸张类型无效');
 if(s.type==='badge'&&s.width!==s.height)throw Error('圆形吧唧的宽高必须相同');
 if(s.safe*2>=Math.min(s.width,s.height)||s.border*2>=Math.min(s.width,s.height))throw Error('边距或边框不能超过成品尺寸的一半');
 for(const k of ['background','borderColor','textColor'])if(!/^#[0-9a-f]{6}$/i.test(s[k]))throw Error('颜色格式无效');
 if(typeof s.caption!=='string'||s.caption.length>100)throw Error('文字最多 100 个字符');
 return s;
}
export function dimensions(s,bleed=true){return{width:s.width+(bleed?s.bleed*2:0),height:s.height+(bleed?s.bleed*2:0)}};
export function layoutSheet(s,count){
 const pw=s.paper==='a4'?210:s.paperWidth,ph=s.paper==='a4'?297:s.paperHeight;
 const {width,height}=dimensions(s);const cols=Math.floor((pw-2*s.margin+s.gap)/(width+s.gap)),rows=Math.floor((ph-2*s.margin+s.gap)/(height+s.gap));
 if(cols<1||rows<1)throw Error('当前谷子尺寸放不进纸张，请增大纸张或减小边距');
 if(!Number.isInteger(count)||count<1||count>2000)throw Error('拼版数量无效');
 const capacity=cols*rows,pages=Math.ceil(count/capacity),positions=[];
 for(let i=0;i<count;i++){const p=i%capacity;positions.push({page:Math.floor(i/capacity),x:s.margin+(p%cols)*(width+s.gap),y:s.margin+Math.floor(p/cols)*(height+s.gap)});}
 return{paperWidth:pw,paperHeight:ph,cols,rows,capacity,pages,positions};
}
function shape(ctx,s,x,y,w,h,outer=0){ctx.beginPath();if(s.type==='badge'){ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);}else{const r=s.type==='sticker'?Math.min(3+outer,w/4,h/4):0;ctx.roundRect(x,y,w,h,r);} }
export function renderDesign(ctx,s,img,{guides=false,bleed=true}={}){
 const d=dimensions(s,bleed),b=bleed?s.bleed:0;
 ctx.save();ctx.scale(ctx.canvas.width/d.width,ctx.canvas.height/d.height);
 shape(ctx,s,0,0,d.width,d.height,b);ctx.clip();ctx.fillStyle=s.type==='photo'?'#fff':s.background;ctx.fillRect(0,0,d.width,d.height);
 const frame=s.type==='photo'?{x:b+3,y:b+3,w:s.width-6,h:s.height-17}:{x:0,y:0,w:d.width,h:d.height};
 ctx.save();ctx.beginPath();ctx.rect(frame.x,frame.y,frame.w,frame.h);ctx.clip();ctx.fillStyle=s.background;ctx.fillRect(frame.x,frame.y,frame.w,frame.h);
 if(img){const factor=Math.max(frame.w/img.width,frame.h/img.height)*s.scale/100;ctx.translate(frame.x+frame.w/2+s.x*s.width/100,frame.y+frame.h/2+s.y*s.height/100);ctx.rotate(s.rotation*Math.PI/180);ctx.drawImage(img,-img.width*factor/2,-img.height*factor/2,img.width*factor,img.height*factor);}
 ctx.restore();
 if(s.border>0){ctx.save();ctx.lineWidth=s.border;ctx.strokeStyle=s.borderColor;shape(ctx,s,b+s.border/2,b+s.border/2,s.width-s.border,s.height-s.border);ctx.stroke();ctx.restore();}
 if(s.caption){ctx.font=`600 ${s.fontSize}px "Noto Sans SC",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.textColor;ctx.fillText(s.caption,b+s.width/2,b+s.height*s.textY/100);}
 ctx.restore();
 if(guides){ctx.save();ctx.scale(ctx.canvas.width/d.width,ctx.canvas.height/d.height);const line=d.width/650;ctx.lineWidth=line;ctx.setLineDash([line*5,line*5]);ctx.strokeStyle='#f6a9da';shape(ctx,s,line,line,d.width-2*line,d.height-2*line,b);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#fff';shape(ctx,s,b,b,s.width,s.height);ctx.stroke();ctx.setLineDash([line*5,line*5]);ctx.strokeStyle='#baf369';shape(ctx,s,b+s.safe,b+s.safe,s.width-2*s.safe,s.height-2*s.safe);ctx.stroke();ctx.restore();}
}
export function inspectDesign(s,img,measure){
 if(!img)return[{level:'info',text:'上传图片后，自动检查清晰度与文字位置。'}];
 const d=dimensions(s);const w=s.type==='photo'?s.width-6:d.width,h=s.type==='photo'?s.height-17:d.height;
 const factor=Math.max(w/img.width,h/img.height)*s.scale/100,effectiveDpi=25.4/factor;
 const checks=[{level:effectiveDpi>=s.dpi?'good':'warn',text:`图片有效清晰度 ${Math.round(effectiveDpi)} DPI${effectiveDpi<s.dpi?'，低于导出目标':''}`}];
 if(s.caption){const tw=measure(s.caption,s.fontSize),halfH=s.fontSize*.6,cx=s.width/2,cy=s.height*s.textY/100;let ok;
 if(s.type==='badge'){const r=s.width/2-s.safe;ok=[-1,1].every(dx=>[-1,1].every(dy=>(dx*tw/2)**2+(cy-s.height/2+dy*halfH)**2<=r*r));}
 else ok=cx-tw/2>=s.safe&&cx+tw/2<=s.width-s.safe&&cy-halfH>=s.safe&&cy+halfH<=s.height-s.safe;
 checks.push({level:ok?'good':'warn',text:ok?'文字位于安全区域内':'文字超出安全区域，请缩小字号或调整位置'});}
 checks.push({level:'info',text:'人脸与主体裁切请在画布上自行确认'});return checks;
}
export function createCanvas(s,img,options={}){const d=dimensions(s,options.bleed!==false);const canvas=document.createElement('canvas');canvas.width=mmToPx(d.width,s.dpi);canvas.height=mmToPx(d.height,s.dpi);if(canvas.width*canvas.height>24000000)throw Error('导出尺寸过大，请降低 DPI');renderDesign(canvas.getContext('2d'),s,img,options);return canvas;}
export function makePreview(s,img){const c=document.createElement('canvas');c.width=1200;c.height=1200;const ctx=c.getContext('2d');ctx.fillStyle='#e8edf0';ctx.fillRect(0,0,1200,1200);ctx.fillStyle='#dfe7ea';ctx.beginPath();ctx.ellipse(850,220,480,340,-.5,0,Math.PI*2);ctx.fill();const design=createCanvas({...s,dpi:150},img,{bleed:false}),scale=Math.min(820/design.width,860/design.height),w=design.width*scale,h=design.height*scale;ctx.save();ctx.translate(600,600);ctx.rotate(-.07);ctx.shadowColor='#223b4050';ctx.shadowBlur=38;ctx.shadowOffsetY=25;ctx.drawImage(design,-w/2,-h/2,w,h);ctx.shadowColor='transparent';if(s.type==='badge'){ctx.save();ctx.beginPath();ctx.arc(0,0,w/2,0,Math.PI*2);ctx.clip();const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#ffffff80');g.addColorStop(.32,'#ffffff10');g.addColorStop(.7,'#ffffff00');g.addColorStop(1,'#00000025');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);ctx.lineWidth=4;ctx.strokeStyle='#ffffff90';ctx.beginPath();ctx.arc(0,0,w/2-2,0,Math.PI*2);ctx.stroke();ctx.restore();}ctx.restore();ctx.fillStyle='#59666b';ctx.font='22px system-ui';ctx.textAlign='center';ctx.fillText('谷子工坊 / 效果示意',600,1120);return c;}
export const blobFromCanvas=(c,type='image/png')=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('导出图片失败')),type,.98));
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
const enc=new TextEncoder();
export function concat(chunks){const out=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}return out;}
export function withPngDpi(bytes,dpi){const data=new Uint8Array(9),v=new DataView(data.buffer);v.setUint32(0,Math.round(dpi/0.0254));v.setUint32(4,Math.round(dpi/0.0254));data[8]=1;const type=enc.encode('pHYs'),chunk=new Uint8Array(21),cv=new DataView(chunk.buffer);cv.setUint32(0,9);chunk.set(type,4);chunk.set(data,8);cv.setUint32(17,crc32(chunk.subarray(4,17)));const segments=[bytes.subarray(0,8)];for(let at=8;at<bytes.length;){const size=new DataView(bytes.buffer,bytes.byteOffset+at,4).getUint32(0),name=new TextDecoder().decode(bytes.subarray(at+4,at+8));if(name!=='pHYs')segments.push(bytes.subarray(at,at+size+12));if(name==='IHDR')segments.push(chunk);at+=size+12;}return concat(segments);}
export async function pngBytes(c,dpi){return withPngDpi(new Uint8Array(await(await blobFromCanvas(c)).arrayBuffer()),dpi);}
export function makeZip(files){let offset=0;const local=[],central=[];for(const file of files){const name=enc.encode(file.name),data=file.data,crc=crc32(data);const head=new Uint8Array(30+name.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);head.set(name,30);local.push(head,data);const cd=new Uint8Array(46+name.length),dv=new DataView(cd.buffer);dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x800,true);dv.setUint32(16,crc,true);dv.setUint32(20,data.length,true);dv.setUint32(24,data.length,true);dv.setUint16(28,name.length,true);dv.setUint32(42,offset,true);cd.set(name,46);central.push(cd);offset+=head.length+data.length;}const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,central.reduce((n,c)=>n+c.length,0),true);ev.setUint32(16,offset,true);return new Blob([...local,...central,end],{type:'application/zip'});}
// Each sheet is a high-quality raster image placed at its exact physical PDF size.
export function makePdf(pages,widthMm,heightMm){const pt=mm=>mm*72/25.4,w=pt(widthMm),h=pt(heightMm);const parts=[enc.encode('%PDF-1.4\n')],offsets=[0];let total=parts[0].length;const add=(id,data)=>{offsets[id]=total;const start=enc.encode(`${id} 0 obj\n`),end=enc.encode('\nendobj\n');parts.push(start,data,end);total+=start.length+data.length+end.length;};add(1,enc.encode('<< /Type /Catalog /Pages 2 0 R >>'));add(2,enc.encode(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`));for(let i=0;i<pages.length;i++){const p=pages[i],id=3+i*3;add(id,enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w.toFixed(5)} ${h.toFixed(5)}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`));add(id+1,concat([enc.encode(`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`),p.bytes,enc.encode('\nendstream')]));const stream=enc.encode(`q\n${w.toFixed(5)} 0 0 ${h.toFixed(5)} 0 0 cm\n/Im0 Do\nQ`);add(id+2,concat([enc.encode(`<< /Length ${stream.length} >>\nstream\n`),stream,enc.encode('\nendstream')]));}const xref=total;parts.push(enc.encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));return new Blob(parts,{type:'application/pdf'});}
