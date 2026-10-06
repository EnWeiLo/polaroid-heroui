import {useEffect,useRef,useState} from 'react'
import {Button,Slider,Tabs,Tab,Card} from '@heroui/react'

const RATIOS={orig:['原圖',0],mini:['Mini',.8],square:['方框',1],wide:['Wide',1.5]}
const FRAMES={white:'白框',black:'黑框',tint:'取色'}
const W=1080,M=60,B=200,PW=W-2*M
const clamp=v=>Math.max(-1,Math.min(1,v))

function geo(img,o){
  const a=RATIOS[o.ratio][1]||img.width/img.height, ph=PW/a
  const s=Math.max(PW/img.width,ph/img.height)*o.zoom, dw=img.width*s, dh=img.height*s
  return {ph,dw,dh,rx:(dw-PW)/2,ry:(dh-ph)/2}
}
function tint(img){
  const c=document.createElement('canvas');c.width=c.height=1
  const x=c.getContext('2d');x.drawImage(img,0,0,1,1)
  const [r,g,b]=x.getImageData(0,0,1,1).data,f=v=>Math.round(v+(255-v)*.82)
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
function draw(cv,img,o){
  const g=geo(img,o);cv.width=W;cv.height=Math.round(M+g.ph+B)
  const x=cv.getContext('2d')
  x.fillStyle=o.frame==='black'?'#111':o.frame==='tint'?tint(img):'#fafafa';x.fillRect(0,0,W,cv.height)
  x.save();x.beginPath();x.rect(M,M,PW,g.ph);x.clip()
  x.drawImage(img,M+(PW-g.dw)/2+clamp(o.ox)*g.rx,M+(g.ph-g.dh)/2+clamp(o.oy)*g.ry,g.dw,g.dh);x.restore()
}

export default function App(){
  const cv=useRef(),file=useRef(),drag=useRef()
  const [img,setImg]=useState(null)
  const [o,setO]=useState({frame:'white',ratio:'orig',zoom:1,ox:0,oy:0})
  const set=p=>setO(s=>({...s,...p}))

  useEffect(()=>{
    const mq=matchMedia('(prefers-color-scheme:dark)')
    const f=()=>document.documentElement.classList.toggle('dark',mq.matches)
    f();mq.addEventListener('change',f);return()=>mq.removeEventListener('change',f)
  },[])
  useEffect(()=>{if(img&&cv.current)draw(cv.current,img,o)},[img,o])

  const load=e=>{
    const f=e.target.files[0];if(!f)return
    const i=new Image();i.onload=()=>{setImg(i);set({ox:0,oy:0,zoom:1})};i.src=URL.createObjectURL(f)
  }
  const down=e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}
  const move=e=>{
    const d=drag.current;if(!d||!img)return
    const k=cv.current.width/cv.current.getBoundingClientRect().width,g=geo(img,o)
    set({ox:g.rx>1?clamp(o.ox+(e.clientX-d.x)*k/g.rx):o.ox,oy:g.ry>1?clamp(o.oy+(e.clientY-d.y)*k/g.ry):o.oy})
    drag.current={x:e.clientX,y:e.clientY}
  }
  const wheel=e=>set({zoom:Math.max(1,Math.min(3,o.zoom-e.deltaY*.002))})
  const save=()=>cv.current.toBlob(async b=>{
    const f=new File([b],'polaroid.png',{type:'image/png'})
    if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f]});return}catch{}}
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='polaroid.png';a.click()
  })
  const tabs={fullWidth:true,size:'sm',classNames:{tabList:'bg-white/40 dark:bg-white/10'}}

  return <div className="min-h-dvh p-3 sm:p-6 pb-28 lg:pb-6">
    <header className="glass !rounded-full sticky top-3 z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
      <h1 className="text-base font-semibold tracking-wide">拍立得小房間</h1>
      <span className="text-xs opacity-60">{img?'拖曳調整構圖':'尚未選取照片'}</span>
    </header>
    <main className="mx-auto mt-4 grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="glass min-h-[320px] items-center justify-center p-4 lg:sticky lg:top-24 lg:self-start" shadow="none">
        {img?<canvas ref={cv} className="max-h-[70dvh] max-w-full rounded-lg shadow-2xl" style={{cursor:'grab'}}
            onPointerDown={down} onPointerMove={move} onPointerUp={()=>drag.current=null} onWheel={wheel}/>
          :<p className="py-24 text-center opacity-60">選擇一張照片開始</p>}
      </Card>
      <div className="grid content-start gap-4">
        <Card className="glass grid gap-4 p-5" shadow="none">
          <input ref={file} type="file" accept="image/*" hidden onChange={load}/>
          <Button color="primary" radius="full" size="lg" onPress={()=>file.current.click()}>選擇照片</Button>
          <div><p className="mb-2 text-xs font-semibold opacity-60">邊框樣式</p>
            <Tabs {...tabs} selectedKey={o.frame} onSelectionChange={k=>set({frame:k})}>
              {Object.entries(FRAMES).map(([k,l])=><Tab key={k} title={l}/>)}</Tabs></div>
          <div><p className="mb-2 text-xs font-semibold opacity-60">照片比例</p>
            <Tabs {...tabs} selectedKey={o.ratio} onSelectionChange={k=>set({ratio:k,ox:0,oy:0})}>
              {Object.entries(RATIOS).map(([k,[l]])=><Tab key={k} title={l}/>)}</Tabs></div>
          <Slider label="縮放" size="sm" minValue={1} maxValue={3} step={.01} value={o.zoom} onChange={v=>set({zoom:v})}/>
          <Button className="hidden lg:flex" radius="full" isDisabled={!img} onPress={save}>下載 / 分享</Button>
        </Card>
      </div>
    </main>
    <div className="glass !rounded-full fixed inset-x-3 bottom-3 z-20 p-2 lg:hidden" style={{marginBottom:'env(safe-area-inset-bottom)'}}>
      <Button fullWidth color="primary" radius="full" isDisabled={!img} onPress={save}>下載 / 分享</Button>
    </div>
  </div>
}
