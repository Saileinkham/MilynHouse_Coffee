import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { onValue, ref as dbRef, set } from "firebase/database";
import { auth, createUserWithEmailAndPassword, db, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "./firebase.js";

// ── Initial Data ──────────────────────────────────────────────────────────────
const DEFAULT_CHANNELS = [
  { id:"walkin",  name:"หน้าร้าน",    icon:"🏪", color:"#6b4c2a", logo:null },
  { id:"grab",    name:"Grab",        icon:"🟢", color:"#00b14f", logo:null },
  { id:"lineman", name:"Line Man",    icon:"💚", color:"#06c755", logo:null },
  { id:"shopee",  name:"Shopee Food", icon:"🟠", color:"#ee4d2d", logo:null },
];
const DEFAULT_PRODUCTS = [
  { id:1, name:"ชานมไข่มุก",          emoji:"🧋", category:"ชานม",      prices:{walkin:65,grab:75,lineman:75,shopee:72} },
  { id:2, name:"มัทฉะลาเต้",          emoji:"🍵", category:"ลาเต้",      prices:{walkin:75,grab:85,lineman:85,shopee:82} },
  { id:3, name:"สตรอเบอร์รี่สมูทตี้", emoji:"🍓", category:"สมูทตี้",   prices:{walkin:70,grab:80,lineman:80,shopee:78} },
  { id:4, name:"ลาเต้เย็น",            emoji:"☕", category:"ลาเต้",      prices:{walkin:60,grab:70,lineman:70,shopee:68} },
  { id:5, name:"น้ำมะพร้าว",           emoji:"🥥", category:"ผลไม้",      prices:{walkin:55,grab:65,lineman:65,shopee:62} },
  { id:6, name:"โกโก้เย็น",            emoji:"🍫", category:"ช็อกโกแลต", prices:{walkin:60,grab:70,lineman:70,shopee:68} },
];
const DEFAULT_SALES = [
  { id:101, productId:1, channelId:"walkin",  qty:40, amount:2600, date:"2026-03-15" },
  { id:102, productId:1, channelId:"grab",    qty:30, amount:2250, date:"2026-03-15" },
  { id:103, productId:2, channelId:"lineman", qty:20, amount:1700, date:"2026-03-15" },
  { id:104, productId:3, channelId:"shopee",  qty:25, amount:1950, date:"2026-03-16" },
  { id:105, productId:4, channelId:"walkin",  qty:35, amount:2100, date:"2026-03-16" },
  { id:106, productId:5, channelId:"grab",    qty:18, amount:1170, date:"2026-03-17" },
  { id:107, productId:6, channelId:"walkin",  qty:22, amount:1320, date:"2026-03-17" },
  { id:108, productId:1, channelId:"shopee",  qty:15, amount:1080, date:"2026-02-10" },
  { id:109, productId:2, channelId:"walkin",  qty:28, amount:2100, date:"2026-02-12" },
  { id:110, productId:3, channelId:"grab",    qty:20, amount:1600, date:"2026-02-20" },
  { id:111, productId:4, channelId:"lineman", qty:18, amount:1260, date:"2026-02-22" },
];
const DEFAULT_EXPENSES = [
  { id:201, category:"วัตถุดิบ",  description:"ชา นม น้ำตาล",    amount:980,  date:"2026-03-15" },
  { id:202, category:"ค่าแรง",    description:"ค่าจ้างพนักงาน", amount:600,  date:"2026-03-15" },
  { id:203, category:"วัตถุดิบ",  description:"ผลไม้สด",         amount:750,  date:"2026-03-16" },
  { id:204, category:"ค่าน้ำไฟ", description:"ค่าสาธารณูปโภค", amount:420,  date:"2026-03-17" },
  { id:205, category:"วัตถุดิบ",  description:"วัตถุดิบประจำเดือน", amount:3200, date:"2026-02-15" },
  { id:206, category:"ค่าแรง",    description:"เงินเดือนพนักงาน",  amount:8000, date:"2026-02-28" },
];

const EXP_CATS = ["วัตถุดิบ","ค่าแรง","ค่าน้ำไฟ","ค่าเช่า","อุปกรณ์","อื่นๆ"];
const DEFAULT_CATEGORIES = [
  { id:"milk-tea", name:"ชานม", color:"#c8a96e" },
  { id:"latte", name:"ลาเต้", color:"#8b6f47" },
  { id:"smoothie", name:"สมูทตี้", color:"#e07c7c" },
  { id:"fruit", name:"ผลไม้", color:"#6dbe8d" },
  { id:"chocolate", name:"ช็อกโกแลต", color:"#7a5c3e" },
  { id:"soda", name:"โซดา", color:"#5ba6c9" },
  { id:"other", name:"อื่นๆ", color:"#8b6f47" },
];
const EMOJIS   = ["🧋","🍵","🍓","☕","🥥","🍫","🍊","🍋","🥤","🍹","🧃","🍺","🧊","🫖","🍑","🫐","🍇","🥭","🍒","🍌"];
const MONTH_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = { width:"100%", padding:"9px 13px", border:"1px solid #d5c5b0", borderRadius:9, fontSize:13, fontFamily:"inherit", background:"#fff", color:"#3a2e1e", outline:"none", boxSizing:"border-box" };
const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#7a6a5a", marginBottom:5, letterSpacing:.8, textTransform:"uppercase" };
const pri = { background:"linear-gradient(135deg,#8b6f47,#5a3820)", color:"#f5e6d0", border:"none", borderRadius:9, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" };
const sec = { background:"#fff", color:"#6b4c2a", border:"1px solid #d5c5b0", borderRadius:9, padding:"10px 0", fontSize:13, cursor:"pointer", fontFamily:"inherit", width:"100%" };

// ── Cloud Storage Hook (Firebase-primary, no localStorage) ────────────────────
function normalizeFirebaseVal(val, defaultValue) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(defaultValue) && val && typeof val === 'object' && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k)))
      return keys.sort((a, b) => +a - +b).map(k => val[k]);
    return defaultValue;
  }
  return val;
}

function useCloudData(key, defaultValue, cloudEnabled) {
  const [data, setDataRaw] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const latestData = useRef(defaultValue);

  useEffect(() => {
    if (!db || !cloudEnabled) { setLoading(false); return; }
    setLoading(true);
    const firebaseRef = dbRef(db, key);
    let cancelled = false;
    const unsub = onValue(
      firebaseRef,
      (snap) => {
        if (cancelled) return;
        const raw = snap.val();
        const val = normalizeFirebaseVal(raw, defaultValue);
if (val === null) {
          latestData.current = Array.isArray(defaultValue) ? [] : defaultValue;
          setDataRaw(Array.isArray(defaultValue) ? [] : defaultValue);
        } else {
          latestData.current = val;
          setDataRaw(val);
        }
        setLoading(false);
      },
      () => { if (!cancelled) setLoading(false); }
    );
    return () => { cancelled = true; unsub(); };
  }, [key, cloudEnabled]);

  const setData = useCallback(async (updater) => {
    const base = latestData.current ?? defaultValue;
    const nextValue = typeof updater === 'function' ? updater(base) : updater;
    latestData.current = nextValue;
    setDataRaw(nextValue);
    if (!db || !cloudEnabled) return;
    setSyncing(true);
    try {
      await set(dbRef(db, key), nextValue);
    } catch { /* onValue will restore Firebase's actual value on failure */ }
    finally { setSyncing(false); }
  }, [key, defaultValue, cloudEnabled]);

  return [data, setData, loading, syncing];
}

function useWindowSize() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ── Excel Helpers ─────────────────────────────────────────────────────────────
function applyStyle(ws, addr, style) {
  if (!ws[addr]) return;
  ws[addr].s = style;
}
const ST = {
  titleBrown: { font:{bold:true,sz:14,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"5C3D1E"}}, alignment:{horizontal:"center",vertical:"center"} },
  subtitle:   { font:{italic:true,sz:10,color:{rgb:"7A6050"}}, fill:{fgColor:{rgb:"F5EDE0"}}, alignment:{horizontal:"left"} },
  header:     { font:{bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"8B5E3C"}}, alignment:{horizontal:"center",wrapText:true}, border:{bottom:{style:"medium",color:{rgb:"C8A96E"}}} },
  rowOdd:     { fill:{fgColor:{rgb:"FFFBF5"}}, alignment:{horizontal:"left"} },
  rowEven:    { fill:{fgColor:{rgb:"F5EDE0"}}, alignment:{horizontal:"left"} },
  numOdd:     { fill:{fgColor:{rgb:"FFFBF5"}}, numFmt:"#,##0", alignment:{horizontal:"right"} },
  numEven:    { fill:{fgColor:{rgb:"F5EDE0"}}, numFmt:"#,##0", alignment:{horizontal:"right"} },
  pctOdd:     { fill:{fgColor:{rgb:"FFFBF5"}}, numFmt:"0.0%", alignment:{horizontal:"right"} },
  pctEven:    { fill:{fgColor:{rgb:"F5EDE0"}}, numFmt:"0.0%", alignment:{horizontal:"right"} },
  totalRow:   { font:{bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"6B4C2A"}}, numFmt:"#,##0", alignment:{horizontal:"right"} },
  totalLabel: { font:{bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"6B4C2A"}}, alignment:{horizontal:"left"} },
  green:      { font:{bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"2D7A4F"}}, numFmt:"#,##0", alignment:{horizontal:"right"} },
  red:        { font:{bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:"C0392B"}}, numFmt:"#,##0", alignment:{horizontal:"right"} },
};

function makeSheet(title, subtitle, headers, rows, colWidths, numCols=[]) {
  const data = [[title], [subtitle], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Title row (row 0)
  const titleAddr = XLSX.utils.encode_cell({r:0,c:0});
  if (ws[titleAddr]) ws[titleAddr].s = ST.titleBrown;
  ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:headers.length-1}},{s:{r:1,c:0},e:{r:1,c:headers.length-1}}];

  // Subtitle row (row 1)
  const subAddr = XLSX.utils.encode_cell({r:1,c:0});
  if (ws[subAddr]) ws[subAddr].s = ST.subtitle;

  // Header row (row 2)
  headers.forEach((_,ci)=>{
    const a=XLSX.utils.encode_cell({r:2,c:ci});
    if(ws[a]) ws[a].s=ST.header;
  });

  // Data rows
  rows.forEach((row,ri)=>{
    const isEven = ri%2===0;
    row.forEach((_,ci)=>{
      const a=XLSX.utils.encode_cell({r:ri+3,c:ci});
      if(!ws[a]) return;
      const isNum = numCols.includes(ci);
      const isPct = numCols.includes(ci+"pct");
      if(ri===rows.length-1 && row[0]==="รวมทั้งปี") {
        ws[a].s = ci===0 ? ST.totalLabel : ST.totalRow;
      } else if(isNum) {
        ws[a].s = isEven ? ST.numOdd : ST.numEven;
      } else if(isPct) {
        ws[a].s = isEven ? ST.pctOdd : ST.pctEven;
      } else {
        ws[a].s = isEven ? ST.rowOdd : ST.rowEven;
      }
    });
  });

  ws["!cols"] = colWidths.map(w=>({wch:w}));
  ws["!rows"] = [{hpt:24},{hpt:16},{hpt:20}];
  return ws;
}

function downloadXLSX(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({name,ws,data})=>{
    const finalWs = ws || (()=>{
      const w=XLSX.utils.aoa_to_sheet(data);
      const range=XLSX.utils.decode_range(w["!ref"]||"A1");
      for(let C=range.s.c;C<=range.e.c;C++){const a=XLSX.utils.encode_cell({r:0,c:C});if(w[a])w[a].s=ST.header;}
      w["!cols"]=data[0].map((_,ci)=>({wch:Math.min(Math.max(...data.map(r=>String(r[ci]??"").length),10)+2,40)}));
      return w;
    })();
    XLSX.utils.book_append_sheet(wb, finalWs, name);
  });
  XLSX.writeFile(wb, filename, {cellStyles:true});
}

// ── Image Helpers ────────────────────────────────────────────────────────────
function compressImage(file, maxW=400, maxH=400, quality=0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Components ────────────────────────────────────────────────────────────────
function SyncBadge({syncing,compact=false,localOnly=false,loggedIn=false}){
  const mode = db ? "firebase" : "local";
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!db) { setOnline(true); return; }
    const unsub = onValue(
      dbRef(db, ".info/connected"),
      (snap) => setOnline(Boolean(snap.val())),
      () => setOnline(false),
    );
    return () => unsub();
  }, []);

  const active = mode === "firebase" && loggedIn && online && !localOnly;
  const color = syncing ? "#c8a96e" : active ? "#6dbe8d" : mode === "firebase" ? "#e0a45b" : "#a09080";
  const label = mode !== "firebase"
    ? "Local • ไม่ซิงค์ข้ามเครื่อง"
    : syncing ? "กำลังซิงค์..."
    : localOnly ? "Local Only"
    : !loggedIn ? "Firebase • ยังไม่ล็อกอิน"
    : online ? "Firebase • Online"
    : "Firebase • Offline";

  return <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color}}>
    <div style={{width:7,height:7,borderRadius:"50%",background:color,animation:syncing?"pulse 1s infinite":"none",flexShrink:0}}/>
    {!compact && <span>{label}</span>}
  </div>;
}

function ChannelGlyph({c,size=18}){
  if (c?.logo) return <img src={c.logo} alt="" style={{width:size,height:size,objectFit:"contain",borderRadius:6}}/>;
  return <span style={{fontSize:size,lineHeight:1}}>{c?.icon||"?"}</span>;
}

function ExportMenu({options}){
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#217a50,#145c36)",color:"#e0f5ec",border:"none",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
      <span>📥</span><span style={{whiteSpace:"nowrap"}}> Export</span> <span style={{fontSize:11,opacity:.7}}>▾</span>
    </button>
    {open&&<><div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:99}}/>
      <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.16)",border:"1px solid #e0d0bc",zIndex:100,minWidth:230,overflow:"hidden"}}>
        {options.map((o,i)=>(
          <button key={i} onClick={()=>{o.action();setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,color:"#3a2e1e",textAlign:"left",borderBottom:i<options.length-1?"1px solid #f0e8db":"none"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f5f0e8"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span style={{fontSize:18}}>{o.icon}</span>
            <div><div style={{fontWeight:600}}>{o.label}</div>{o.desc&&<div style={{fontSize:11,color:"#a09080"}}>{o.desc}</div>}</div>
            <span style={{marginLeft:"auto",fontSize:10,color:"#7ab87a",fontWeight:700,background:"#e8f5ee",borderRadius:4,padding:"2px 6px"}}>XLSX</span>
          </button>
        ))}
      </div>
    </>}
  </div>;
}

function Modal({title,onClose,children,width=400}){
  const w=useWindowSize(),mob=w<600;
  return <div style={{position:"fixed",inset:0,background:"rgba(20,12,4,.58)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(5px)"}}>
    <div style={{background:"#faf6f0",borderRadius:mob?"20px 20px 0 0":20,padding:mob?"20px 16px 28px":28,width:mob?"100%":width,maxWidth:mob?"100%":"95vw",maxHeight:mob?"92vh":"88vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.25)",border:"1px solid #e8d8c0"}}>
      {mob&&<div style={{width:36,height:4,background:"#d5c5b0",borderRadius:2,margin:"0 auto 16px"}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#3a2e1e",margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#b0a090",padding:"4px 8px"}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

function LoadingScreen(){
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#faf6f0,#f5e6d0)",fontFamily:"'Sarabun',sans-serif"}}>
    <div style={{fontSize:52,marginBottom:16,animation:"bounce .8s infinite alternate"}}>🧋</div>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#3a2e1e",marginBottom:8}}>Milyn House</div>
    <div style={{fontSize:13,color:"#a09080"}}>กำลังโหลดข้อมูล ☁️...</div>
  </div>;
}

function LoginScreen({onSkip}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const [resetSent,setResetSent]=useState(false);

  const ERR_MAP={
    "auth/user-not-found":"ไม่พบบัญชีนี้",
    "auth/wrong-password":"รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-credential":"อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/email-already-in-use":"อีเมลนี้มีบัญชีอยู่แล้ว",
    "auth/weak-password":"รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    "auth/invalid-email":"รูปแบบอีเมลไม่ถูกต้อง",
    "auth/too-many-requests":"ลองใหม่ภายหลัง (ลองมากเกินไป)",
    "auth/network-request-failed":"ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
  };

  async function submit(){
    if(!email.trim()||!password){setErr("กรุณากรอกอีเมลและรหัสผ่าน");return;}
    setBusy(true);setErr("");
    try{
      if(mode==="login") await signInWithEmailAndPassword(auth,email.trim(),password);
      else await createUserWithEmailAndPassword(auth,email.trim(),password);
    }catch(e){
      setErr(ERR_MAP[e.code]||"เกิดข้อผิดพลาด: "+e.code);
    }finally{setBusy(false);}
  }

  async function resetPassword(){
    if(!email.trim()){setErr("กรอกอีเมลก่อน แล้วกด 'ลืมรหัสผ่าน'");return;}
    setBusy(true);setErr("");
    try{
      await sendPasswordResetEmail(auth,email.trim());
      setResetSent(true);
    }catch(e){
      setErr(ERR_MAP[e.code]||"ส่งอีเมลไม่ได้: "+e.code);
    }finally{setBusy(false);}
  }

  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#faf6f0,#f5e6d0)",fontFamily:"'Sarabun',sans-serif",padding:20}}>
    <div style={{background:"#fff",borderRadius:24,padding:36,width:"100%",maxWidth:380,boxShadow:"0 16px 60px rgba(90,40,10,.18)",border:"1px solid #e8d8c0"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:48,marginBottom:10,animation:"bounce .9s infinite alternate"}}>🧋</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#3a2e1e",marginBottom:4}}>Milyn House</div>
        <div style={{fontSize:13,color:"#a09080"}}>{mode==="login"?"เข้าสู่ระบบ":"สร้างบัญชีใหม่"}</div>
      </div>

      {resetSent
        ? <div style={{background:"#e8f7ef",borderRadius:12,padding:16,textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:22,marginBottom:6}}>✅</div>
            <div style={{fontSize:13,color:"#2d7a4f",fontWeight:600}}>ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว</div>
            <div style={{fontSize:12,color:"#5a8a70",marginTop:4}}>กรุณาตรวจสอบอีเมลของคุณ</div>
            <button onClick={()=>{setResetSent(false);setMode("login");}} style={{marginTop:12,background:"none",border:"none",color:"#6b4c2a",fontSize:13,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>กลับไปเข้าสู่ระบบ</button>
          </div>
        : <>
            <div style={{marginBottom:14}}>
              <label style={lbl}>อีเมล</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
            <div style={{marginBottom:mode==="login"?8:20}}>
              <label style={lbl}>รหัสผ่าน</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
            {mode==="login"&&<div style={{textAlign:"right",marginBottom:16}}>
              <button onClick={resetPassword} disabled={busy} style={{background:"none",border:"none",color:"#8b6f47",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>ลืมรหัสผ่าน?</button>
            </div>}
            {err&&<div style={{fontSize:12,color:"#c0392b",marginBottom:14,background:"#fdecea",borderRadius:8,padding:"8px 12px"}}>{err}</div>}
            <button onClick={submit} disabled={busy} style={{...pri,marginBottom:12,opacity:busy?.7:1}}>
              {busy?"กำลังดำเนินการ...":(mode==="login"?"🔐 เข้าสู่ระบบ":"✨ สร้างบัญชี")}
            </button>
            <div style={{textAlign:"center",fontSize:13,color:"#8b7060",marginBottom:16}}>
              {mode==="login"
                ?<>ยังไม่มีบัญชี? <button onClick={()=>{setMode("register");setErr("");}} style={{background:"none",border:"none",color:"#6b4c2a",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>สมัครสมาชิก</button></>
                :<>มีบัญชีอยู่แล้ว? <button onClick={()=>{setMode("login");setErr("");}} style={{background:"none",border:"none",color:"#6b4c2a",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>เข้าสู่ระบบ</button></>
              }
            </div>
          </>
      }

      {onSkip&&<div style={{borderTop:"1px solid #f0e8db",paddingTop:14,textAlign:"center"}}>
        <button onClick={onSkip} style={{background:"none",border:"none",color:"#a09080",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>ใช้แบบ Local (ไม่ซิงค์ข้ามเครื่อง)</button>
      </div>}
    </div>
  </div>;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("monthly");
  const [modal,setModal]=useState(null);
  const [editing,setEditing]=useState(null);

  // ── Firebase Auth ────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));
  const [localOnly, setLocalOnly] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState(null);
  const [catForm, setCatForm] = useState({ name:"", color:"#c8a96e" });

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const cloudEnabled = Boolean(db) && Boolean(user) && !localOnly;

  const [channels,setChannels,loadingCh,syncingCh]=useCloudData("milyn_channels",DEFAULT_CHANNELS,cloudEnabled);
  const [products,setProducts,loadingPr,syncingPr]=useCloudData("milyn_products",DEFAULT_PRODUCTS,cloudEnabled);
  const [sales,setSales,loadingSl,syncingSl]=useCloudData("milyn_sales",DEFAULT_SALES,cloudEnabled);
  const [expenses,setExpenses,loadingEx,syncingEx]=useCloudData("milyn_expenses",DEFAULT_EXPENSES,cloudEnabled);
  const [categories,setCategories,loadingCa,syncingCa]=useCloudData("milyn_categories",DEFAULT_CATEGORIES,cloudEnabled);

  const loading=loadingCh||loadingPr||loadingSl||loadingEx||loadingCa;
  const syncing=syncingCh||syncingPr||syncingSl||syncingEx||syncingCa;
  const winW=useWindowSize();
  const mob=winW<640;
  const containerMax = winW < 1100 ? 1040 : winW < 1400 ? 1200 : winW < 1750 ? 1440 : 1600;

  const [pForm,setPForm]=useState({name:"",emoji:"🧋",category:"ชานม",prices:{},image:null});
  const [cForm,setCForm]=useState({name:"",icon:"🏪",color:"#6b4c2a",logo:null});
  const [sForm,setSForm]=useState({productId:"",channelId:"",qty:1,unitPrice:"",date:new Date().toISOString().split("T")[0]});
  const [eForm,setEForm]=useState({category:"วัตถุดิบ",description:"",amount:"",date:new Date().toISOString().split("T")[0]});
  const [editExp,setEditExp]=useState(null); // expense being edited

  // Monthly dashboard state
  const now = new Date();
  const [selYear,setSelYear]=useState(now.getFullYear());
  const [selMonth,setSelMonth]=useState(now.getMonth()); // 0-11 or "all"
  const [selChannel,setSelChannel]=useState("all"); // channel filter

  const ch=channels||[], pr=products||[], sl=sales||[], ex=expenses||[], cats=categories||[];
  const catColor = Object.fromEntries(cats.map(c=>[c.name,c.color]));
  const fallbackCat = cats.find(c=>c.name==="อื่นๆ")?.name || cats[0]?.name || "อื่นๆ";

  useEffect(() => {
    if (!cats.length) return;
    setPForm((prev) => {
      if (cats.some((c) => c.name === prev.category)) return prev;
      return { ...prev, category: fallbackCat };
    });
  }, [cats.length]);

  function openAddCat(){
    setCatEditing(null);
    setCatForm({ name:"", color:"#c8a96e" });
    setCatOpen(true);
  }
  function openEditCat(c){
    setCatEditing(c);
    setCatForm({ name:c.name, color:c.color });
    setCatOpen(true);
  }
  function saveCat(){
    const name = catForm.name.trim();
    if(!name) return;
    if (cats.some(c=>c.name===name && c.id!==catEditing?.id)) return;
    const next = { id: catEditing?.id || `cat_${Date.now()}`, name, color: catForm.color || "#c8a96e" };
    if (catEditing) {
      setCategories(prev => prev.map(c=>c.id===catEditing.id?next:c));
      if (catEditing.name !== name) setProducts(prev => prev.map(p=>p.category===catEditing.name?{...p,category:name}:p));
    } else {
      setCategories(prev => [...prev, next]);
    }
    setCatOpen(false);
    setCatEditing(null);
  }
  function delCat(id){
    const target = cats.find(c=>c.id===id);
    if(!target) return;
    if(target.name==="อื่นๆ") return;
    if(!window.confirm("ลบหมวดหมู่นี้? สินค้าที่อยู่หมวดนี้จะย้ายไป 'อื่นๆ'")) return;
    const toCat = cats.find(c=>c.name==="อื่นๆ")?.name || cats.find(c=>c.id!==id)?.name || "อื่นๆ";
    setCategories(prev=>prev.filter(c=>c.id!==id));
    setProducts(prev=>prev.map(p=>p.category===target.name?{...p,category:toCat}:p));
  }

  // ── Monthly Derived ────────────────────────────────────────────────────────
  const isAllMonths = selMonth === "all";
  const ym = isAllMonths ? String(selYear) : `${selYear}-${String(selMonth+1).padStart(2,"0")}`;
  const periodLabel = isAllMonths ? `ทั้งปี ${selYear}` : `${MONTH_TH[selMonth]} ${selYear}`;

  // Filter by month/year + channel
  const mSales=sl.filter(s=>{
    if(!s?.date) return false;
    const inPeriod = isAllMonths ? s.date.startsWith(String(selYear)) : s.date.startsWith(ym);
    const inChan=selChannel==="all"||s.channelId===selChannel;
    return inPeriod&&inChan;
  });
  const mExpenses=ex.filter(e=>{
    if(!e?.date) return false;
    return isAllMonths ? e.date.startsWith(String(selYear)) : e.date.startsWith(ym);
  });

  const mIncome=mSales.reduce((s,x)=>s+x.amount,0);
  const mExpense=mExpenses.reduce((s,x)=>s+x.amount,0);
  const mProfit=mIncome-mExpense;
  const mCups=mSales.reduce((s,x)=>s+x.qty,0);

  // Per-product stats for this month/channel
  const prodStats={};
  mSales.forEach(s=>{
    if(!prodStats[s.productId]) prodStats[s.productId]={cups:0,amount:0};
    prodStats[s.productId].cups+=s.qty;
    prodStats[s.productId].amount+=s.amount;
  });
  const rankedProds=[...pr].sort((a,b)=>(prodStats[b.id]?.cups||0)-(prodStats[a.id]?.cups||0));
  const top5=rankedProds.slice(0,5).filter(p=>prodStats[p.id]?.cups>0);
  const allMenuSorted=rankedProds;

  // Channel breakdown for this month
  const chanStats={};
  mSales.forEach(s=>{
    if(!chanStats[s.channelId]) chanStats[s.channelId]={cups:0,amount:0};
    chanStats[s.channelId].cups+=s.qty;
    chanStats[s.channelId].amount+=s.amount;
  });
  const maxChanAmt=Math.max(...ch.map(c=>chanStats[c.id]?.amount||0),1);

  // Available years/months from data
  const allDates=sl.map(s=>s.date.slice(0,7));
  const uniqueYears=[...new Set(allDates.map(d=>parseInt(d.slice(0,4))))].sort((a,b)=>b-a);
  if(!uniqueYears.includes(selYear)) uniqueYears.push(selYear);

  // Overall derived
  const totalIncome=sl.reduce((s,x)=>s+x.amount,0);
  const totalExpense=ex.reduce((s,x)=>s+x.amount,0);
  const netProfit=totalIncome-totalExpense;
  const soldMap={}; sl.forEach(s=>{soldMap[s.productId]=(soldMap[s.productId]||0)+s.qty;});
  const chanRevMap={}; sl.forEach(s=>{chanRevMap[s.channelId]=(chanRevMap[s.channelId]||0)+s.amount;});
  const sortedProds=[...pr].sort((a,b)=>(soldMap[b.id]||0)-(soldMap[a.id]||0));
  const chanMax=Math.max(...ch.map(c=>chanRevMap[c.id]||0),1);
  const today=new Date().toISOString().slice(0,10);

  // ── Excel Exports ──────────────────────────────────────────────────────────
  const exportMonthlyXLSX=()=>{
    const chanLabel=selChannel==="all"?"ทุกช่องทาง":(ch.find(c=>c.id===selChannel)?.name||"");
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: สรุปการเงิน ──────────────────────────────────────────────
    const ws1 = makeSheet(
      `รายงานสรุป${isAllMonths?"ทั้งปี":"ประจำเดือน"} ${periodLabel} — Milyn House`,
      `ช่องทาง: ${chanLabel} | ออกรายงานวันที่ ${today}`,
      ["รายการ","จำนวน (฿)"],
      [
        ["รายรับรวม", mIncome],
        ["รายจ่ายรวม", mExpense],
        ["กำไรสุทธิ", mProfit],
        ["จำนวนแก้วที่ขาย", mCups],
        ["อัตรากำไร (%)", mIncome>0?mProfit/mIncome:0],
      ],
      [30,20],[1]
    );
    XLSX.utils.book_append_sheet(wb, ws1, "สรุปการเงิน");

    // ── Sheet 2: Top 5 เมนูขายดี ─────────────────────────────────────────
    const top5rows = rankedProds.slice(0,5).map((p,i)=>[
      i+1, p.name, p.category,
      prodStats[p.id]?.cups||0,
      prodStats[p.id]?.amount||0,
    ]);
    top5rows.push(["","รวม","",
      rankedProds.slice(0,5).reduce((a,p)=>a+(prodStats[p.id]?.cups||0),0),
      rankedProds.slice(0,5).reduce((a,p)=>a+(prodStats[p.id]?.amount||0),0),
    ]);
    const ws2 = makeSheet(
      `Top 5 เมนูขายดี — ${periodLabel}`,
      `ช่องทาง: ${chanLabel}`,
      ["อันดับ","สินค้า","หมวดหมู่","จำนวน (แก้ว)","รายรับ (฿)"],
      top5rows,
      [8,24,16,14,16],[3,4]
    );
    XLSX.utils.book_append_sheet(wb, ws2, "Top5 ขายดี");

    // ── Sheet 3: ยอดขายทุกเมนู ───────────────────────────────────────────
    const allRows = allMenuSorted.map((p,i)=>[
      i+1, p.name, p.category,
      prodStats[p.id]?.cups||0,
      prodStats[p.id]?.amount||0,
    ]);
    allRows.push(["","รวมทั้งหมด","", mCups, mIncome]);
    const ws3 = makeSheet(
      `ยอดขายทุกเมนู — ${periodLabel}`,
      `ช่องทาง: ${chanLabel}`,
      ["ลำดับ","สินค้า","หมวดหมู่","จำนวน (แก้ว)","รายรับ (฿)"],
      allRows,
      [8,24,16,14,16],[3,4]
    );
    XLSX.utils.book_append_sheet(wb, ws3, "ยอดขายทุกเมนู");

    // ── Sheet 4: ยอดตามช่องทาง ───────────────────────────────────────────
    const chanRows = ch.map((c,i)=>[
      i+1, c.name,
      chanStats[c.id]?.cups||0,
      chanStats[c.id]?.amount||0,
      mIncome>0?(chanStats[c.id]?.amount||0)/mIncome:0,
    ]);
    chanRows.push(["","รวมทั้งหมด", mCups, mIncome, 1]);
    const ws4 = makeSheet(
      `ยอดขายตามช่องทาง — ${periodLabel}`,
      `ออกรายงานวันที่ ${today}`,
      ["ลำดับ","ช่องทาง","จำนวน (แก้ว)","รายรับ (฿)","สัดส่วน (%)"],
      chanRows,
      [8,18,14,16,14],[2,3]
    );
    XLSX.utils.book_append_sheet(wb, ws4, "ตามช่องทาง");

    XLSX.writeFile(wb, `milyn-${isAllMonths?"yearly":"monthly"}-${ym}.xlsx`, {cellStyles:true});
  };
  // ── Export: ขายเครื่องดื่ม (ตรง template) ────────────────────────────────
  const exportSalesXLSX=()=>{
    const sorted=[...sl].sort((a,b)=>a.date.localeCompare(b.date));
    const rows=sorted.map((s,i)=>{
      const p=pr.find(x=>x.id===s.productId),c=ch.find(x=>x.id===s.channelId);
      const u=Number.isFinite(s.unitPrice)?s.unitPrice:(s.qty?Math.round(s.amount/s.qty):0);
      return [i+1,s.date,p?.name||"-",c?.name||"-",s.qty,u,s.amount,""];
    });
    rows.push(["","","","","","รวม",totalIncome,""]);
    const ws=makeSheet(
      "บันทึกขายเครื่องดื่ม — Milyn House",
      `ออกรายงานวันที่ ${today} | ${sl.length} รายการ`,
      ["ลำดับ","วันที่","รายการเครื่องดื่ม","ช่องทางขาย","จำนวน (แก้ว)","ราคา/แก้ว (บาท)","รวม (บาท)","หมายเหตุ"],
      rows,[6,14,22,14,14,16,14,14],[4,5,6]
    );
    downloadXLSX(`milyn-sales-${today}.xlsx`,[{name:"ขายเครื่องดื่ม",ws}]);
  };

  // ── Export: ค่าใช้จ่าย (ตรง template) ──────────────────────────────────
  const exportExpensesXLSX=()=>{
    const sorted=[...ex].sort((a,b)=>a.date.localeCompare(b.date));
    const rows=sorted.map((e,i)=>[i+1,e.date,e.category,e.description,e.amount,"",""]);
    rows.push(["","","","รวมทั้งหมด",totalExpense,"",""]);
    const ws=makeSheet(
      "ค่าใช้จ่าย — Milyn House",
      `ออกรายงานวันที่ ${today} | ${ex.length} รายการ`,
      ["ลำดับ","วันที่","หมวดค่าใช้จ่าย","รายละเอียด","จำนวนเงิน (บาท)","เลขที่เอกสาร","หมายเหตุ"],
      rows,[6,14,18,28,16,14,14],[4]
    );
    downloadXLSX(`milyn-expenses-${today}.xlsx`,[{name:"ค่าใช้จ่าย",ws}]);
  };

  // ── Export: สินค้า & ราคา ────────────────────────────────────────────────
  const exportProductsXLSX=()=>{
    const rows=sortedProds.map((p,i)=>{
      const rev=sl.filter(s=>s.productId===p.id).reduce((a,b)=>a+b.amount,0);
      return [i+1,p.name,p.category,soldMap[p.id]||0,rev,...ch.map(c=>p.prices[c.id]||0)];
    });
    const ws=makeSheet(
      "รายการสินค้า & ราคาตามช่องทาง — Milyn House",
      `ออกรายงานวันที่ ${today}`,
      ["ลำดับ","สินค้า","หมวดหมู่","แก้วที่ขาย","รายรับรวม (บาท)",...ch.map(c=>`ราคา ${c.name} (บาท)`)],
      rows,[6,22,14,14,16,...ch.map(()=>14)],[3,4,...ch.map((_,i)=>5+i)]
    );
    downloadXLSX(`milyn-products-${today}.xlsx`,[{name:"สินค้า",ws}]);
  };

  // ── Export: รายงานสรุปทั้งหมด 5 sheets (ตรง template) ──────────────────
  const exportSummaryXLSX=()=>{
    const MONTHS_FULL=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
    const yr=new Date().getFullYear();

    // Sheet 1: สรุปรายเดือน
    const monthRows=MONTHS_FULL.map((mon,mi)=>{
      const mSales=sl.filter(s=>{const d=new Date(s.date);return d.getMonth()===mi&&d.getFullYear()===yr;});
      const mEx=ex.filter(e=>{const d=new Date(e.date);return d.getMonth()===mi&&d.getFullYear()===yr;});
      const yodsai=mSales.reduce((a,b)=>a+b.amount,0);
      const rawMat=mEx.filter(e=>e.category==="วัตถุดิบ").reduce((a,b)=>a+b.amount,0);
      const other=mEx.filter(e=>e.category!=="วัตถุดิบ").reduce((a,b)=>a+b.amount,0);
      const totalEx=rawMat+other;
      const profit=yodsai-totalEx;
      const cups=mSales.reduce((a,b)=>a+b.qty,0);
      return [mon,yodsai,rawMat,other,totalEx,profit,yodsai>0?profit/yodsai:0,cups];
    });
    const totRawMat=ex.filter(e=>e.category==="วัตถุดิบ").reduce((a,b)=>a+b.amount,0);
    const totOther=ex.filter(e=>e.category!=="วัตถุดิบ").reduce((a,b)=>a+b.amount,0);
    monthRows.push(["รวมทั้งปี "+yr,totalIncome,totRawMat,totOther,totalExpense,netProfit,totalIncome>0?netProfit/totalIncome:0,sl.reduce((a,b)=>a+b.qty,0)]);
    const ws1=makeSheet(
      `สรุปรายรับ-รายจ่าย รายเดือน ปี ${yr} — Milyn House`,
      "คำนวณอัตโนมัติจากข้อมูลทุกรายการ",
      ["เดือน","ยอดขาย (บาท)","ต้นทุนวัตถุดิบ (บาท)","ค่าใช้จ่ายอื่น (บาท)","รวมรายจ่าย (บาท)","กำไร/ขาดทุน (บาท)","อัตรากำไร (%)","จำนวนแก้วขาย"],
      monthRows,[14,18,20,20,18,18,16,14],[1,2,3,4,5,7]
    );

    // Sheet 2: ขายเครื่องดื่ม
    const sortedSl=[...sl].sort((a,b)=>a.date.localeCompare(b.date));
    const sRows=sortedSl.map((s,i)=>{const p=pr.find(x=>x.id===s.productId),c=ch.find(x=>x.id===s.channelId);const u=Number.isFinite(s.unitPrice)?s.unitPrice:(s.qty?Math.round(s.amount/s.qty):0);return [i+1,s.date,p?.name||"-",c?.name||"-",s.qty,u,s.amount,""];});
    sRows.push(["","","","","","รวม",totalIncome,""]);
    const ws2=makeSheet(`บันทึกขายเครื่องดื่ม ปี ${yr} — Milyn House`,"บันทึกทุกรายการขาย แยกช่องทาง",
      ["ลำดับ","วันที่","รายการเครื่องดื่ม","ช่องทางขาย","จำนวน (แก้ว)","ราคา/แก้ว (บาท)","รวม (บาท)","หมายเหตุ"],
      sRows,[6,14,22,14,14,16,14,14],[4,5,6]);

    // Sheet 3: ค่าใช้จ่าย
    const sortedEx=[...ex].sort((a,b)=>a.date.localeCompare(b.date));
    const eRows=sortedEx.map((e,i)=>[i+1,e.date,e.category,e.description,e.amount,"",""]);
    eRows.push(["","","","รวมทั้งหมด",totalExpense,"",""]);
    const ws3=makeSheet(`ค่าใช้จ่าย ปี ${yr} — Milyn House`,"ค่าเช่า ค่าน้ำไฟ ค่าจ้าง วัตถุดิบ ฯลฯ",
      ["ลำดับ","วันที่","หมวดค่าใช้จ่าย","รายละเอียด","จำนวนเงิน (บาท)","เลขที่เอกสาร","หมายเหตุ"],
      eRows,[6,14,18,28,16,14,14],[4]);

    // Sheet 4: สินค้าขายดี
    const pRows=sortedProds.map((p,i)=>{const rev=sl.filter(s=>s.productId===p.id).reduce((a,b)=>a+b.amount,0);return [i+1,p.name,p.category,soldMap[p.id]||0,rev,...ch.map(c=>p.prices[c.id]||0)];});
    const ws4=makeSheet("สินค้าขายดี & ราคาตามช่องทาง — Milyn House",`ออกรายงานวันที่ ${today}`,
      ["ลำดับ","สินค้า","หมวดหมู่","แก้วที่ขาย","รายรับรวม (บาท)",...ch.map(c=>`ราคา ${c.name} (บาท)`)],
      pRows,[6,22,14,14,16,...ch.map(()=>14)],[3,4,...ch.map((_,i)=>5+i)]);

    // Sheet 5: ช่องทางขาย
    const chRows=ch.map((c,i)=>{const rev=chanRevMap[c.id]||0;const cnt=sl.filter(x=>x.channelId===c.id).reduce((a,b)=>a+b.qty,0);return [i+1,c.name,cnt,rev,totalIncome>0?rev/totalIncome:0];});
    chRows.push(["","รวมทั้งหมด",sl.reduce((a,b)=>a+b.qty,0),totalIncome,1]);
    const ws5=makeSheet("สรุปยอดขายตามช่องทาง — Milyn House",`ออกรายงานวันที่ ${today}`,
      ["ลำดับ","ช่องทางขาย","จำนวนแก้ว","รายรับรวม (บาท)","สัดส่วน (%)"],
      chRows,[6,18,14,18,14],[2,3]);

    downloadXLSX(`milyn-report-${today}.xlsx`,[
      {name:"สรุปรายเดือน",ws:ws1},{name:"ขายเครื่องดื่ม",ws:ws2},
      {name:"ค่าใช้จ่าย",ws:ws3},{name:"สินค้าขายดี",ws:ws4},{name:"ช่องทางขาย",ws:ws5},
    ]);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openAddProd(){const p={};ch.forEach(c=>p[c.id]="");setPForm({name:"",emoji:"🧋",category:fallbackCat,prices:p,image:null});setEditing(null);setModal("prod");}
  function openEditProd(p){const pr2={};ch.forEach(c=>pr2[c.id]=p.prices[c.id]??"");setPForm({name:p.name,emoji:p.emoji,category:p.category,prices:pr2,image:p.image||null});setEditing(p);setModal("prod");}
  function saveProd(){if(!pForm.name)return;const prices={};ch.forEach(c=>{prices[c.id]=parseFloat(pForm.prices[c.id])||0;});const pData={...pForm,prices};if(editing)setProducts(prev=>prev.map(p=>p.id===editing.id?{...p,...pData}:p));else setProducts(prev=>[...prev,{id:Date.now(),...pData}]);close();}
  function delProd(id){if(window.confirm("ลบสินค้านี้?"))setProducts(prev=>prev.filter(p=>p.id!==id));}
  function openAddChan(){setCForm({name:"",icon:"🏪",color:"#6b4c2a",logo:null});setEditing(null);setModal("chan");}
  function openEditChan(c){setCForm({name:c.name,icon:c.icon,color:c.color,logo:c.logo||null});setEditing(c);setModal("chan");}
  function saveChan(){if(!cForm.name)return;if(editing){setChannels(prev=>prev.map(c=>c.id===editing.id?{...c,...cForm}:c));}else{const nid="ch_"+Date.now();setChannels(prev=>[...prev,{id:nid,...cForm}]);setProducts(prev=>prev.map(p=>({...p,prices:{...p.prices,[nid]:0}})));}close();}
  function delChan(id){if(window.confirm("ลบช่องทางนี้?"))setChannels(prev=>prev.filter(c=>c.id!==id));}
  function openSale(p){
    const channelId = ch[0]?.id || "";
    const unitPrice = p?.prices?.[channelId] || 0;
    setSForm({productId:p.id,channelId,qty:1,unitPrice:String(unitPrice),date:new Date().toISOString().split("T")[0]});
    setModal("sale");
  }
  const saleProd=pr.find(p=>p.id===sForm.productId);
  const saleDefaultUnit=saleProd?(saleProd.prices[sForm.channelId]||0):0;
  const saleUnit=Number.isFinite(parseFloat(sForm.unitPrice)) ? (parseFloat(sForm.unitPrice)||0) : saleDefaultUnit;
  const saleQty=parseInt(sForm.qty)||0;
  const saleTotal=saleUnit*saleQty;

  useEffect(() => {
    if (!sForm.productId || !sForm.channelId) return;
    const p = pr.find(x => x.id === sForm.productId);
    const u = p?.prices?.[sForm.channelId] ?? 0;
    setSForm(prev => ({...prev, unitPrice: String(u)}));
  }, [sForm.productId, sForm.channelId]);

  // ── Conditional returns (AFTER all hooks) ─────────────────────────────────
  if (authLoading) return <LoadingScreen />;
  if (db && !user && !localOnly) return <LoginScreen onSkip={() => setLocalOnly(true)} />;
  if (loading) return <LoadingScreen />;

  const close=()=>{setModal(null);setEditing(null);};

  function saveSale(){
    if(!sForm.productId||!sForm.channelId||!sForm.qty)return;
    const qty=parseInt(sForm.qty)||0;
    const unit=Number.isFinite(parseFloat(sForm.unitPrice)) ? (parseFloat(sForm.unitPrice)||0) : 0;
    const amount=unit*qty;
    setSales(prev=>[...prev,{id:Date.now(),...sForm,qty,unitPrice:unit,amount}]);
    close();
  }
  function saveExp(){if(!eForm.description||!eForm.amount)return;setExpenses(prev=>[...prev,{id:Date.now(),...eForm,amount:parseFloat(eForm.amount)}]);setEForm({category:"วัตถุดิบ",description:"",amount:"",date:new Date().toISOString().split("T")[0]});close();}

  const TABS=[["monthly","📅","สรุปรายเดือน"],["dashboard","📊","ภาพรวม"],["sales","🛒","ยอดขาย"],["expenses","💸","รายจ่าย"],["products","🧃","สินค้า"],["channels","📡","ช่องทางขาย"],["categories","🏷️","หมวดหมู่"]];

  return (
    <div style={{fontFamily:"'Sarabun','Noto Sans Thai',sans-serif",background:"#faf6f0",minHeight:"100vh",color:"#3a2e1e"}}>

      {/* ── Header ── */}
      <header style={{background:"linear-gradient(135deg,#2e1e0e,#6b4c2a)",padding:"0 16px",boxShadow:"0 4px 24px rgba(30,10,0,.35)",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:containerMax,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:mob?52:60}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:mob?20:24}}>🧋</span>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:mob?15:18,color:"#f5e6d0",letterSpacing:1}}>Milyn House</div>
              {!mob&&<div style={{fontSize:9,color:"#c8a96e",letterSpacing:2,textTransform:"uppercase"}}>Drink Shop Management</div>}
            </div>
          </div>
          {mob
            ? <div style={{display:"flex",alignItems:"center",gap:8}}>
                <SyncBadge syncing={syncing} compact loggedIn={Boolean(user)} localOnly={localOnly}/>
                {user&&<button onClick={()=>signOut(auth)} style={{background:"none",border:"1px solid rgba(200,169,110,.3)",color:"#c0aa88",borderRadius:7,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>ออก</button>}
              </div>
            : <nav style={{display:"flex",gap:2,alignItems:"center"}}>
                {TABS.map(([k,ic,lb])=>(
                  <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?"rgba(200,169,110,.22)":"transparent",border:tab===k?"1px solid rgba(200,169,110,.45)":"1px solid transparent",color:tab===k?"#f5e6d0":"#c0aa88",padding:"5px 11px",borderRadius:8,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                    <span>{ic}</span><span>{lb}</span>
                  </button>
                ))}
                <div style={{width:1,height:24,background:"rgba(255,255,255,.15)",margin:"0 6px"}}/>
                <SyncBadge syncing={syncing} loggedIn={Boolean(user)} localOnly={localOnly}/>
                {user&&<>
                  <div style={{width:1,height:24,background:"rgba(255,255,255,.15)",margin:"0 6px"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:"#c0aa88",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</span>
                    <button onClick={()=>signOut(auth)} style={{background:"none",border:"1px solid rgba(200,169,110,.35)",color:"#c8a96e",borderRadius:7,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>ออกจากระบบ</button>
                  </div>
                </>}
              </nav>
          }
        </div>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      {mob&&<nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"linear-gradient(180deg,#2e1e0e,#1e0e04)",borderTop:"1px solid rgba(200,169,110,.3)",display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 4px 10px",background:"none",border:"none",cursor:"pointer",gap:2,borderTop:tab===k?"2px solid #c8a96e":"2px solid transparent"}}>
            <span style={{fontSize:18,lineHeight:1}}>{ic}</span>
            <span style={{fontSize:9,color:tab===k?"#f5e6d0":"#a08868",fontFamily:"'Sarabun',sans-serif",fontWeight:tab===k?700:400,letterSpacing:.3}}>{lb}</span>
          </button>
        ))}
      </nav>}

      <main style={{maxWidth:containerMax,margin:"0 auto",padding:mob?"16px 14px 80px":"24px 28px"}}>

        {/* ══════════════════════════════════════════════════════
            📅 MONTHLY DASHBOARD
        ══════════════════════════════════════════════════════ */}
        {tab==="monthly"&&(
          <div>
            {/* Title + Export */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:mob?18:22,margin:0}}>📅 สรุปรายเดือน</h2>
              <ExportMenu options={[{icon:"📅",label:`สรุป ${periodLabel}`,desc:"4 sheets: การเงิน Top5 เมนู ช่องทาง",action:exportMonthlyXLSX},{icon:"📊",label:"รายงานทั้งปี",desc:"5 sheets ครบทุกรายการ",action:exportSummaryXLSX}]}/>
            </div>

            {/* ── Month / Year Selector ── */}
            <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",border:"1px solid #ede0cc",marginBottom:18,display:"flex",alignItems:"center",gap:mob?10:16,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:600,color:"#6b4c2a"}}>ช่วงเวลา</span>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>setSelMonth("all")} style={{padding:"5px 14px",borderRadius:20,border:isAllMonths?"none":"1px solid #d5c5b0",background:isAllMonths?"linear-gradient(135deg,#3a6ea8,#1e4a80)":"#fff",color:isAllMonths?"#e8f2ff":"#5a4a3a",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:isAllMonths?700:400}}>
                  ทั้งปี
                </button>
                {MONTH_TH.map((m,i)=>(
                  <button key={i} onClick={()=>setSelMonth(i)} style={{padding:"5px 12px",borderRadius:20,border:selMonth===i?"none":"1px solid #d5c5b0",background:selMonth===i?"linear-gradient(135deg,#8b6f47,#5a3820)":"#fff",color:selMonth===i?"#f5e6d0":"#5a4a3a",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:selMonth===i?700:400}}>
                    {m}
                  </button>
                ))}
              </div>
              <select value={selYear} onChange={e=>setSelYear(parseInt(e.target.value))} style={{...inp,width:90,padding:"6px 10px",fontSize:13}}>
                {uniqueYears.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* ── Channel Filter ── */}
            <div style={{background:"#fff",borderRadius:14,padding:"14px 20px",border:"1px solid #ede0cc",marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:"#8b7060",marginBottom:10,letterSpacing:.8,textTransform:"uppercase"}}>📡 กรองตามช่องทาง</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>setSelChannel("all")} style={{padding:"7px 16px",borderRadius:20,border:selChannel==="all"?"none":"1px solid #d5c5b0",background:selChannel==="all"?"linear-gradient(135deg,#6b4c2a,#3a2010)":"#fff",color:selChannel==="all"?"#f5e6d0":"#3a2e1e",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:selChannel==="all"?700:400,display:"flex",alignItems:"center",gap:6}}>
                  🌐 ทุกช่องทาง
                </button>
                {ch.map(c=>(
                  <button key={c.id} onClick={()=>setSelChannel(c.id)} style={{padding:"7px 16px",borderRadius:20,border:selChannel===c.id?`2px solid ${c.color}`:"1px solid #d5c5b0",background:selChannel===c.id?c.color+"18":"#fff",color:selChannel===c.id?c.color:"#3a2e1e",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:selChannel===c.id?700:400,display:"flex",alignItems:"center",gap:6}}>
                    <ChannelGlyph c={c} size={16}/>{c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── KPI Cards ── */}
            <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {[
                {lb:"รายรับ",v:`฿${mIncome.toLocaleString()}`,ic:"📈",c:"#2d7a4f",bg:"linear-gradient(135deg,#e8f7ef,#d0edd9)",bo:"#a3d8b9"},
                {lb:"รายจ่าย",v:`฿${mExpense.toLocaleString()}`,ic:"📉",c:"#c0392b",bg:"linear-gradient(135deg,#fdecea,#f9d5d2)",bo:"#f0a8a3"},
                {lb:"กำไรสุทธิ",v:`฿${mProfit.toLocaleString()}`,ic:"✨",c:mProfit>=0?"#6b4c2a":"#c0392b",bg:"linear-gradient(135deg,#fef9f0,#f5e6d0)",bo:"#e8cfa0"},
                {lb:"แก้วทั้งหมด",v:`${mCups.toLocaleString()} แก้ว`,ic:"🧋",c:"#3a6ea8",bg:"linear-gradient(135deg,#eaf2fc,#d0e4f7)",bo:"#a8c8ee"},
              ].map(k=>(
                <div key={k.lb} style={{background:k.bg,border:`1px solid ${k.bo}`,borderRadius:14,padding:"16px 18px"}}>
                  <div style={{fontSize:20,marginBottom:5}}>{k.ic}</div>
                  <div style={{fontSize:11,color:"#7a6a5a",marginBottom:3,fontWeight:600}}>{k.lb}</div>
                  <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?14:18,marginBottom:18}}>

              {/* ── Top 5 ── */}
              <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #ede0cc"}}>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:16,color:"#3a2e1e",display:"flex",alignItems:"center",gap:8}}>
                  🏆 Top 5 เมนูขายดี
                  <span style={{fontSize:11,color:"#a09080",fontWeight:400}}>{periodLabel}{selChannel!=="all"?" · "+ch.find(c=>c.id===selChannel)?.name:""}</span>
                </h3>
                {top5.length===0&&<div style={{padding:"20px 0",textAlign:"center",color:"#b0a090",fontSize:13}}>ไม่มีข้อมูลช่วงนี้</div>}
                {top5.map((p,i)=>{
                  const stat=prodStats[p.id]||{cups:0,amount:0};
                  const maxCups=prodStats[top5[0].id]?.cups||1;
                  return <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#f5c842,#e0a800)":i===1?"linear-gradient(135deg,#d1d1d1,#b0b0b0)":i===2?"linear-gradient(135deg,#cd7f32,#a05c20)":"#ede0cc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i<3?"#fff":"#8b7a6a",flexShrink:0,boxShadow:i===0?"0 2px 8px rgba(245,200,66,.5)":"none"}}>{i+1}</div>
                    {p.image
                      ? <div style={{width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                          <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        </div>
                      : <span style={{fontSize:22}}>{p.emoji}</span>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                      <div style={{height:5,background:"#f0e8db",borderRadius:3,marginTop:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(stat.cups/maxCups)*100}%`,background:i===0?"linear-gradient(90deg,#f5c842,#c8a96e)":"linear-gradient(90deg,#c8a96e,#8b6f47)",borderRadius:3,transition:"width .5s"}}/>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#3a2e1e"}}>{stat.cups}<span style={{fontSize:10,color:"#a09080",fontWeight:400}}> แก้ว</span></div>
                      <div style={{fontSize:11,color:"#2d7a4f",fontWeight:600}}>฿{stat.amount.toLocaleString()}</div>
                    </div>
                  </div>;
                })}
              </div>

              {/* ── Channel Breakdown ── */}
              <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #ede0cc"}}>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:16,color:"#3a2e1e"}}>📡 ยอดขายตามช่องทาง</h3>
                {ch.map(c=>{
                  const stat=chanStats[c.id]||{cups:0,amount:0};
                  return <div key={c.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:4}}>
                      <span style={{display:"flex",alignItems:"center",gap:6,fontWeight:600}}><ChannelGlyph c={c} size={16}/> {c.name}</span>
                      <span style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:12,color:"#6b8abf"}}>{stat.cups} แก้ว</span>
                        <span style={{fontWeight:700,color:c.color}}>฿{stat.amount.toLocaleString()}</span>
                      </span>
                    </div>
                    <div style={{height:7,background:"#f0e8db",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(stat.amount/maxChanAmt)*100}%`,background:c.color,borderRadius:4,opacity:.85,transition:"width .5s"}}/>
                    </div>
                  </div>;
                })}
              </div>
            </div>

            {/* ── All Menu Table ── */}
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #ede0cc",overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:"1px solid #f0e8db",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <h3 style={{fontSize:15,fontWeight:700,margin:0,color:"#3a2e1e"}}>📋 ยอดขายทุกเมนู</h3>
                <span style={{fontSize:12,color:"#a09080"}}>{periodLabel}{selChannel!=="all"?" · "+ch.find(c=>c.id===selChannel)?.name:""}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr 60px 90px":"40px 1fr 100px 80px 100px 100px",padding:mob?"9px 14px":"9px 20px",background:"#f5ede0",fontSize:11,fontWeight:700,color:"#8b7060",letterSpacing:.5,textTransform:"uppercase"}}>
                {!mob&&<span style={{fontSize:11,fontWeight:700,color:"#8b7060"}}>#</span>}<span>เมนู</span>{!mob&&<span>หมวด</span>}<span style={{textAlign:"center"}}>แก้ว</span><span style={{textAlign:"right"}}>รายรับ (฿)</span>{!mob&&<span style={{textAlign:"right"}}>สัดส่วน</span>}
              </div>
              {allMenuSorted.map((p,i)=>{
                const stat=prodStats[p.id]||{cups:0,amount:0};
                const pct=mCups>0?((stat.cups/mCups)*100).toFixed(1):0;
                return <div key={p.id} style={{display:"grid",gridTemplateColumns:mob?"1fr 60px 90px":"40px 1fr 100px 80px 100px 100px",padding:mob?"10px 14px":"11px 20px",borderTop:"1px solid #f5ede0",alignItems:"center",opacity:stat.cups===0?.4:1}}>
                  {!mob&&<span style={{fontSize:12,color:"#b0a090",fontWeight:600}}>#{i+1}</span>}
                  <span style={{display:"flex",alignItems:"center",gap:8}}>{p.image
                        ? <div style={{width:mob?24:28,height:mob?24:28,borderRadius:6,overflow:"hidden",flexShrink:0}}>
                            <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          </div>
                        : <span style={{fontSize:mob?16:20}}>{p.emoji}</span>
                      }<div><div style={{fontSize:13,fontWeight:600}}>{p.name}</div>{mob&&<div style={{fontSize:10,color:catColor[p.category]||"#8b6f47"}}>{p.category}</div>}</div></span>
                  {!mob&&<span style={{display:"inline-flex"}}><span style={{background:(catColor[p.category]||"#c8a96e")+"22",color:catColor[p.category]||"#8b6f47",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{p.category}</span></span>}
                  <span style={{textAlign:"center",fontSize:14,fontWeight:700,color:stat.cups>0?"#3a2e1e":"#c0b8b0"}}>{stat.cups}</span>
                  <span style={{textAlign:"right",fontSize:13,fontWeight:700,color:stat.amount>0?"#2d7a4f":"#c0b8b0"}}>฿{stat.amount.toLocaleString()}</span>
                  {!mob&&<span style={{textAlign:"right"}}>
                    <span style={{fontSize:12,color:"#6b4c2a",fontWeight:600}}>{pct}%</span>
                    <div style={{height:4,background:"#f0e8db",borderRadius:2,marginTop:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#c8a96e,#8b6f47)",borderRadius:2}}/>
                    </div>
                  </span>}
                </div>;
              })}
              {allMenuSorted.length===0&&<div style={{padding:32,textAlign:"center",color:"#b0a090"}}>ไม่มีข้อมูล</div>}
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr 60px 90px":"40px 1fr 100px 80px 100px 100px",padding:mob?"12px 14px":"12px 20px",borderTop:"2px solid #e8d5b8",background:"#fffbf5"}}>
                {!mob&&<span/>}<span style={{fontSize:13,fontWeight:700,color:"#6b4c2a"}}>รวมทั้งหมด</span>{!mob&&<span/>}<span style={{textAlign:"center",fontSize:14,fontWeight:700,color:"#3a6ea8"}}>{mCups}</span><span style={{textAlign:"right",fontSize:14,fontWeight:700,color:"#2d7a4f"}}>฿{mIncome.toLocaleString()}</span><span style={{textAlign:"right",fontSize:13,fontWeight:700,color:"#6b4c2a"}}>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>ภาพรวมร้าน</h2>
              <ExportMenu options={[{icon:"📊",label:"รายงานสรุปทั้งหมด",desc:"ภาพรวม ยอดขาย รายจ่าย",action:exportSummaryXLSX},{icon:"🛒",label:"ยอดขาย",action:exportSalesXLSX},{icon:"💸",label:"รายจ่าย",action:exportExpensesXLSX},{icon:"🧃",label:"สินค้า & ราคาตามช่องทาง",action:exportProductsXLSX}]}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(3,1fr)",gap:14,marginBottom:22}}>
              {[{lb:"รายรับรวม",v:totalIncome,ic:"📈",c:"#2d7a4f",bg:"linear-gradient(135deg,#e8f7ef,#d0edd9)",bo:"#a3d8b9"},{lb:"รายจ่ายรวม",v:totalExpense,ic:"📉",c:"#c0392b",bg:"linear-gradient(135deg,#fdecea,#f9d5d2)",bo:"#f0a8a3"},{lb:"กำไรสุทธิ",v:netProfit,ic:"✨",c:netProfit>=0?"#6b4c2a":"#c0392b",bg:"linear-gradient(135deg,#fef9f0,#f5e6d0)",bo:"#e8cfa0"}].map(k=>(
                <div key={k.lb} style={{background:k.bg,border:`1px solid ${k.bo}`,borderRadius:14,padding:"18px 20px"}}>
                  <div style={{fontSize:20,marginBottom:5}}>{k.ic}</div>
                  <div style={{fontSize:11,color:"#7a6a5a",marginBottom:3,fontWeight:600}}>{k.lb}</div>
                  <div style={{fontSize:24,fontWeight:700,color:k.c}}>฿{k.v.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?14:18}}>
              <div style={{background:"#fff",borderRadius:14,padding:mob?16:20,border:"1px solid #ede0cc"}}>
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:15}}>🏆 ขายดีที่สุด (ทั้งหมด)</h3>
                {sortedProds.slice(0,5).map((p,i)=>{const sold=soldMap[p.id]||0,mx=soldMap[sortedProds[0]?.id]||1;return <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:11}}><div style={{width:26,height:26,borderRadius:"50%",background:i===0?"#f5c842":i===1?"#d1d1d1":i===2?"#cd7f32":"#ede0cc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<3?"#fff":"#8b7a6a",flexShrink:0}}>{i+1}</div>{p.image
                      ? <div style={{width:28,height:28,borderRadius:7,overflow:"hidden",flexShrink:0}}>
                          <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        </div>
                      : <span style={{fontSize:20}}>{p.emoji}</span>
                    }<div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.name}</div><div style={{height:5,background:"#f0e8db",borderRadius:3,marginTop:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(sold/mx)*100}%`,background:"linear-gradient(90deg,#c8a96e,#8b6f47)",borderRadius:3}}/></div></div><div style={{fontSize:14,fontWeight:700,color:"#6b4c2a",minWidth:44,textAlign:"right"}}>{sold}<span style={{fontSize:10,fontWeight:400,color:"#a09080"}}> แก้ว</span></div></div>;})}
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #ede0cc"}}>
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:15}}>📡 รายรับตามช่องทาง</h3>
                {ch.map(c=>{const rev=chanRevMap[c.id]||0;return <div key={c.id} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}><span style={{display:"flex",alignItems:"center",gap:6}}><ChannelGlyph c={c} size={16}/> {c.name}</span><span style={{fontWeight:700,color:c.color}}>฿{rev.toLocaleString()}</span></div><div style={{height:6,background:"#f0e8db",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(rev/chanMax)*100}%`,background:c.color,borderRadius:4,opacity:.8}}/></div></div>;})}
              </div>
            </div>
          </div>
        )}

        {/* ══ SALES ══ */}
        {tab==="sales"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>ยอดขาย</h2>
              <div style={{display:"flex",gap:10}}>
                <ExportMenu options={[{icon:"🛒",label:"ยอดขายทั้งหมด",desc:`${sl.length} รายการ`,action:exportSalesXLSX}]}/>
                <button onClick={()=>{const pid=pr[0]?.id||"";const cid=ch[0]?.id||"";const p=pr.find(x=>x.id===pid);const u=p?.prices?.[cid]??0;setSForm({productId:pid,channelId:cid,qty:1,unitPrice:String(u),date:new Date().toISOString().split("T")[0]});setModal("sale");}} style={{...pri,width:"auto",padding:mob?"8px 12px":"9px 18px",fontSize:mob?12:13}}>➕{mob?" ขาย":" บันทึกการขาย"}</button>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #ede0cc",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr 70px 90px 36px":"1fr 1fr 70px 80px 90px 36px",padding:mob?"9px 14px":"10px 18px",background:"#f5ede0",fontSize:11,fontWeight:700,color:"#8b7060",letterSpacing:.5,textTransform:"uppercase"}}>
                <span>สินค้า</span>{!mob&&<span>ช่องทาง</span>}<span style={{textAlign:"center"}}>แก้ว</span>{!mob&&<span style={{textAlign:"right"}}>ต่อแก้ว</span>}<span style={{textAlign:"right"}}>รวม</span><span/>
              </div>
              {[...sl].reverse().map(s2=>{const p=pr.find(x=>x.id===s2.productId),c=ch.find(x=>x.id===s2.channelId);const u=Number.isFinite(s2.unitPrice)?s2.unitPrice:(s2.qty?Math.round(s2.amount/s2.qty):0);return <div key={s2.id} style={{display:"grid",gridTemplateColumns:mob?"1fr 70px 90px 36px":"1fr 1fr 70px 80px 90px 36px",padding:mob?"11px 14px":"12px 18px",borderTop:"1px solid #f5ede0",alignItems:"center"}}><span style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:18}}>{p?.emoji||"🧋"}</span><div><div style={{fontSize:13,fontWeight:600}}>{p?.name||"(ลบแล้ว)"}</div>{mob&&<div style={{fontSize:11,color:c?.color||"#555",display:"flex",alignItems:"center",gap:6}}><ChannelGlyph c={c} size={14}/> {c?.name}</div>}</div></span>{!mob&&<span style={{display:"flex",alignItems:"center",gap:6}}><ChannelGlyph c={c} size={16}/><span style={{fontSize:12,color:c?.color||"#555"}}>{c?.name||"(ลบแล้ว)"}</span></span>}<span style={{textAlign:"center",fontSize:14,fontWeight:700}}>{s2.qty}</span>{!mob&&<span style={{textAlign:"right",fontSize:12,color:"#7a6a5a"}}>฿{u}</span>}<span style={{textAlign:"right",fontSize:14,fontWeight:700,color:"#2d7a4f"}}>฿{s2.amount.toLocaleString()}</span><button onClick={()=>setSales(prev=>prev.filter(x=>x.id!==s2.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#d0b8a0",fontSize:15,textAlign:"center"}}>✕</button></div>;})}
              {sl.length===0&&<div style={{padding:32,textAlign:"center",color:"#b0a090"}}>ยังไม่มีรายการขาย</div>}
              {sl.length>0&&<div style={{display:"flex",justifyContent:"flex-end",padding:"10px 18px",borderTop:"2px solid #f0e0c8",background:"#fffbf5"}}><span style={{fontSize:14,fontWeight:700,color:"#2d7a4f"}}>รวม ฿{totalIncome.toLocaleString()}</span></div>}
            </div>
          </div>
        )}

        {/* ══ EXPENSES ══ */}
        {tab==="expenses"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>รายจ่าย</h2>
              <div style={{display:"flex",gap:10}}>
                <ExportMenu options={[{icon:"💸",label:"รายจ่ายทั้งหมด",desc:`${ex.length} รายการ`,action:exportExpensesXLSX}]}/>
                <button onClick={()=>setModal("exp")} style={{...pri,width:"auto",padding:mob?"8px 12px":"9px 18px",fontSize:mob?12:13}}>➕{mob?" เพิ่ม":" เพิ่มรายจ่าย"}</button>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #ede0cc",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:mob?"100px 1fr 90px 36px":"120px 1fr 100px 110px 36px",padding:mob?"9px 14px":"10px 18px",background:"#f5ede0",fontSize:11,fontWeight:700,color:"#8b7060",letterSpacing:.5,textTransform:"uppercase"}}>
                <span>หมวด</span><span>รายละเอียด</span><span style={{textAlign:"right"}}>จำนวน</span>{!mob&&<span style={{textAlign:"center"}}>วันที่</span>}<span/>
              </div>
              {[...ex].reverse().map(e=><div key={e.id} style={{display:"grid",gridTemplateColumns:mob?"100px 1fr 90px 36px":"120px 1fr 100px 110px 36px",padding:mob?"10px 14px":"12px 18px",borderTop:"1px solid #f5ede0",alignItems:"center"}}><span style={{background:"#fdecea",color:"#c0392b",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{e.category}</span><div style={{paddingRight:8}}><div style={{fontSize:13}}>{e.description}</div>{mob&&<div style={{fontSize:10,color:"#a09080"}}>{e.date}</div>}</div><span style={{textAlign:"right",fontSize:14,fontWeight:700,color:"#c0392b"}}>฿{e.amount.toLocaleString()}</span>{!mob&&<span style={{textAlign:"center",fontSize:12,color:"#a09080"}}>{e.date}</span>}<button onClick={()=>{setEditExp(e);setEForm({category:e.category,description:e.description,amount:String(e.amount),date:e.date});setModal("editExp");}} style={{background:"none",border:"none",cursor:"pointer",color:"#8b6f47",fontSize:17,padding:"0 4px"}}>✏️</button></div>)}
              {ex.length===0&&<div style={{padding:32,textAlign:"center",color:"#b0a090"}}>ยังไม่มีรายจ่าย</div>}
              {ex.length>0&&<div style={{display:"flex",justifyContent:"flex-end",padding:"10px 18px",borderTop:"2px solid #f0e0c8",background:"#fffbf5"}}><span style={{fontSize:14,fontWeight:700,color:"#c0392b"}}>รวม ฿{totalExpense.toLocaleString()}</span></div>}
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ══ */}
        {tab==="products"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>รายการเครื่องดื่ม</h2>
              <div style={{display:"flex",gap:10}}>
                <ExportMenu options={[{icon:"🧃",label:"สินค้า & ราคาตามช่องทาง",action:exportProductsXLSX}]}/>
                <button onClick={openAddProd} style={{...pri,width:"auto",padding:mob?"8px 12px":"9px 18px",fontSize:mob?12:13}}>➕{mob?" เพิ่ม":" เพิ่มเครื่องดื่ม"}</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(210px,1fr))",gap:16}}>
              {sortedProds.map((p,i)=>{const sold=soldMap[p.id]||0,rev=sl.filter(s=>s.productId===p.id).reduce((a,b)=>a+b.amount,0);return <div key={p.id} style={{background:"#fff",borderRadius:16,padding:mob?14:18,border:"1px solid #ede0cc",position:"relative"}}>{i<3&&<div style={{position:"absolute",top:10,right:10,background:i===0?"#f5c842":i===1?"#c8c8c8":"#cd7f32",color:i===0?"#7a5a00":"#444",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,zIndex:2,boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}>#{i+1}</div>}<div style={{marginBottom:8}}>
                  {p.image
                    ? <div style={{width:"100%",height:mob?90:100,borderRadius:12,overflow:"hidden",background:"#f5ede0"}}>
                        <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      </div>
                    : <div style={{fontSize:36,lineHeight:1}}>{p.emoji||"🧋"}</div>
                  }
                </div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{p.name}</div><div style={{display:"inline-block",background:(catColor[p.category]||"#c8a96e")+"22",color:catColor[p.category]||"#8b6f47",borderRadius:20,padding:"2px 8px",fontSize:10,marginBottom:10,border:`1px solid ${(catColor[p.category]||"#c8a96e")}44`}}>{p.category}</div><div style={{marginBottom:10}}>{ch.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7a6a5a",marginBottom:2}}><span style={{display:"flex",alignItems:"center",gap:6}}><ChannelGlyph c={c} size={14}/> {c.name}</span><span style={{fontWeight:600,color:c.color}}>฿{p.prices[c.id]||0}</span></div>)}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7a6a5a",paddingTop:9,borderTop:"1px solid #f0e8db",marginBottom:12}}><span>ขาย <b style={{color:"#3a2e1e"}}>{sold}</b> แก้ว</span><span>฿<b style={{color:"#2d7a4f"}}>{rev.toLocaleString()}</b></span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}><button onClick={()=>openSale(p)} style={{...pri,fontSize:11,padding:"7px 0"}}>🛒 ขาย</button><button onClick={()=>openEditProd(p)} style={{...sec,fontSize:11,padding:"7px 0"}}>✏️ แก้ไข</button><button onClick={()=>delProd(p.id)} style={{background:"#fdecea",color:"#c0392b",border:"1px solid #f0a8a3",borderRadius:9,padding:"7px 0",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️ ลบ</button></div></div>;})}
            </div>
          </div>
        )}

        {/* ══ CHANNELS ══ */}
        {tab==="channels"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>ช่องทางการขาย</h2>
              <button onClick={openAddChan} style={{...pri,width:"auto",padding:mob?"8px 12px":"9px 18px",fontSize:mob?12:13}}>➕{mob?" เพิ่ม":" เพิ่มช่องทาง"}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
              {ch.map(c=>{const rev=chanRevMap[c.id]||0,cnt=sl.filter(x=>x.channelId===c.id).reduce((a,b)=>a+b.qty,0),pct=totalIncome>0?((rev/totalIncome)*100).toFixed(1):0;return <div key={c.id} style={{background:"#fff",borderRadius:16,padding:22,border:`2px solid ${c.color}33`}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:46,height:46,borderRadius:12,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><ChannelGlyph c={c} size={26}/></div><div style={{fontSize:16,fontWeight:700}}>{c.name}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div style={{background:"#f5f0e8",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:10,color:"#a09080",fontWeight:600}}>รายรับรวม</div><div style={{fontSize:18,fontWeight:700,color:c.color}}>฿{rev.toLocaleString()}</div></div><div style={{background:"#f5f0e8",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:10,color:"#a09080",fontWeight:600}}>แก้วที่ขาย</div><div style={{fontSize:18,fontWeight:700}}>{cnt}</div></div></div><div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7a6a5a",marginBottom:4}}><span>สัดส่วน</span><span style={{fontWeight:700,color:c.color}}>{pct}%</span></div><div style={{height:6,background:"#f0e8db",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:c.color,borderRadius:4,opacity:.85}}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button onClick={()=>openEditChan(c)} style={{...sec,fontSize:12,padding:"7px 0"}}>✏️ แก้ไข</button><button onClick={()=>delChan(c.id)} style={{background:"#fdecea",color:"#c0392b",border:"1px solid #f0a8a3",borderRadius:9,padding:"7px 0",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️ ลบ</button></div></div>;})}
            </div>
          </div>
        )}

        {/* ══ CATEGORIES ══ */}
        {tab==="categories"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,margin:0}}>หมวดหมู่</h2>
              <button onClick={openAddCat} style={{...pri,width:"auto",padding:mob?"8px 12px":"9px 18px",fontSize:mob?12:13}}>➕{mob?" เพิ่ม":" เพิ่มหมวดหมู่"}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
              {cats.map(c=>{
                const cnt = pr.filter(p=>p.category===c.name).length;
                return <div key={c.id} style={{background:"#fff",borderRadius:16,padding:18,border:`2px solid ${c.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:12,background:c.color+"22",border:`1px solid ${c.color}55`}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#a09080"}}>{cnt} สินค้า</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button onClick={()=>openEditCat(c)} style={{...sec,fontSize:12,padding:"7px 0"}}>✏️ แก้ไข</button>
                    <button onClick={()=>delCat(c.id)} disabled={c.name==="อื่นๆ"} style={{background:c.name==="อื่นๆ"?"#f5f0e8":"#fdecea",color:c.name==="อื่นๆ"?"#a09080":"#c0392b",border:`1px solid ${c.name==="อื่นๆ"?"#e8d8c0":"#f0a8a3"}`,borderRadius:9,padding:"7px 0",fontSize:12,cursor:c.name==="อื่นๆ"?"not-allowed":"pointer",fontFamily:"inherit"}}>🗑️ ลบ</button>
                  </div>
                </div>;
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {catOpen&&<Modal title={catEditing?"แก้ไขหมวดหมู่":"เพิ่มหมวดหมู่"} onClose={()=>{setCatOpen(false);setCatEditing(null);}} width={360}>
        <div style={{marginBottom:14}}><label style={lbl}>ชื่อหมวด</label><input value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} placeholder="เช่น กาแฟ" style={inp}/></div>
        <div style={{marginBottom:18}}><label style={lbl}>สีหมวด</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={catForm.color} onChange={e=>setCatForm({...catForm,color:e.target.value})} style={{width:40,height:36,borderRadius:8,border:"1px solid #d5c5b0",cursor:"pointer",padding:2}}/><input value={catForm.color} onChange={e=>setCatForm({...catForm,color:e.target.value})} style={{...inp,flex:1}}/></div></div>
        <div style={{background:catForm.color+"22",borderRadius:10,padding:12,marginBottom:20,border:`1px solid ${catForm.color}44`,display:"flex",alignItems:"center",gap:10}}><div style={{width:28,height:28,borderRadius:8,background:catForm.color,border:`1px solid ${catForm.color}`}}/><span style={{fontWeight:700,color:"#3a2e1e"}}>{catForm.name||"ชื่อหมวด"}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>{setCatOpen(false);setCatEditing(null);}} style={sec}>ยกเลิก</button><button onClick={saveCat} style={pri}>💾 บันทึก</button></div>
      </Modal>}

      {modal==="prod"&&<Modal title={editing?"แก้ไขเครื่องดื่ม":"เพิ่มเครื่องดื่ม"} onClose={close} width={440}>

        {/* Image upload */}
        <div style={{marginBottom:16}}>
          <label style={lbl}>รูปเมนู (ไม่บังคับ)</label>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {/* Preview */}
            <div style={{width:80,height:80,borderRadius:14,border:"2px dashed #d5c5b0",overflow:"hidden",flexShrink:0,background:"#fef9f0",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
              {pForm.image
                ? <img src={pForm.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <div style={{background:(catColor[pForm.category]||"#c8a96e")+"33",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{pForm.emoji||"🧋"}</div>
              }
            </div>
            <div style={{flex:1}}>
              <label style={{display:"inline-block",background:"linear-gradient(135deg,#8b6f47,#5a3820)",color:"#f5e6d0",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                📷 เลือกรูป
                <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                  const file=e.target.files?.[0];
                  if(!file) return;
                  const compressed=await compressImage(file);
                  setPForm(f=>({...f,image:compressed}));
                }}/>
              </label>
              {pForm.image&&<button onClick={()=>setPForm(f=>({...f,image:null}))} style={{marginLeft:8,background:"#fdecea",color:"#c0392b",border:"none",borderRadius:8,padding:"9px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️ ลบรูป</button>}
              <div style={{fontSize:11,color:"#a09080",marginTop:6}}>JPG/PNG ขนาดไม่เกิน 5MB</div>
            </div>
          </div>
        </div>

        <div style={{marginBottom:14}}><label style={lbl}>ชื่อเครื่องดื่ม</label><input value={pForm.name} onChange={e=>setPForm({...pForm,name:e.target.value})} placeholder="เช่น ชานมไข่มุก" style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <label style={lbl}>Emoji <span style={{fontWeight:400,color:"#b0a090",textTransform:"none",letterSpacing:0}}>(ถ้าไม่ใส่รูป)</span></label>
            <select value={pForm.emoji} onChange={e=>setPForm({...pForm,emoji:e.target.value})} style={{...inp,opacity:pForm.image?0.4:1}}>
              <option value="">— ไม่เลือก —</option>
              {EMOJIS.map(em=><option key={em} value={em}>{em} {em}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>หมวดหมู่</label>
            <select value={pForm.category} onChange={e=>setPForm({...pForm,category:e.target.value})} style={inp}>
              {[...new Set([pForm.category,...cats.map(c=>c.name)])].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{background:"#fef9f0",borderRadius:12,padding:14,border:"1px solid #e8d8c0",marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:"#7a6a5a",marginBottom:12,letterSpacing:.8,textTransform:"uppercase"}}>💰 ราคาตามช่องทาง</div>
          {ch.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:30,height:30,borderRadius:8,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}><ChannelGlyph c={c} size={18}/></div><span style={{flex:1,fontSize:13,fontWeight:600}}>{c.name}</span><span style={{fontSize:13,color:"#8b7060"}}>฿</span><input type="number" value={pForm.prices[c.id]||""} onChange={e=>setPForm({...pForm,prices:{...pForm.prices,[c.id]:e.target.value}})} placeholder="0" style={{...inp,width:80,textAlign:"right",padding:"7px 10px"}}/></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={close} style={sec}>ยกเลิก</button><button onClick={saveProd} style={pri}>💾 บันทึก</button></div>
      </Modal>}

      {modal==="chan"&&<Modal title={editing?"แก้ไขช่องทาง":"เพิ่มช่องทางใหม่"} onClose={close} width={360}>
        <div style={{marginBottom:16}}>
          <label style={lbl}>โลโก้ (ไม่บังคับ)</label>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:70,height:70,borderRadius:14,border:"2px dashed #d5c5b0",overflow:"hidden",flexShrink:0,background:"#fef9f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {cForm.logo
                ? <img src={cForm.logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,background:cForm.color+"22"}}>{cForm.icon||"🏪"}</div>
              }
            </div>
            <div style={{flex:1}}>
              <label style={{display:"inline-block",background:"linear-gradient(135deg,#8b6f47,#5a3820)",color:"#f5e6d0",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                🖼️ เลือกรูป
                <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                  const file=e.target.files?.[0];
                  if(!file) return;
                  const compressed=await compressImage(file, 220, 220, 0.8);
                  setCForm(f=>({...f,logo:compressed}));
                }}/>
              </label>
              {cForm.logo&&<button onClick={()=>setCForm(f=>({...f,logo:null}))} style={{marginLeft:8,background:"#fdecea",color:"#c0392b",border:"none",borderRadius:8,padding:"9px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️ ลบรูป</button>}
              <div style={{fontSize:11,color:"#a09080",marginTop:6}}>JPG/PNG ขนาดไม่เกิน 5MB</div>
            </div>
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={lbl}>ชื่อช่องทาง</label><input value={cForm.name} onChange={e=>setCForm({...cForm,name:e.target.value})} placeholder="เช่น TikTok Shop" style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={lbl}>ไอคอน (Emoji)</label><input value={cForm.icon} onChange={e=>setCForm({...cForm,icon:e.target.value})} placeholder="🏪" style={{...inp,opacity:cForm.logo?0.4:1}}/></div>
          <div><label style={lbl}>สีช่องทาง</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={cForm.color} onChange={e=>setCForm({...cForm,color:e.target.value})} style={{width:40,height:36,borderRadius:8,border:"1px solid #d5c5b0",cursor:"pointer",padding:2}}/><input value={cForm.color} onChange={e=>setCForm({...cForm,color:e.target.value})} style={{...inp,flex:1}}/></div></div>
        </div>
        <div style={{background:"#fef9f0",borderRadius:10,padding:12,marginBottom:20,border:"1px solid #e8d8c0",display:"flex",alignItems:"center",gap:10}}><ChannelGlyph c={cForm} size={26}/><span style={{fontWeight:700,color:cForm.color,fontSize:15}}>{cForm.name||"ชื่อช่องทาง"}</span><span style={{fontSize:11,color:"#a09080",marginLeft:"auto"}}>Preview</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={close} style={sec}>ยกเลิก</button><button onClick={saveChan} style={pri}>💾 บันทึก</button></div>
      </Modal>}

      {modal==="sale"&&<Modal title="บันทึกการขาย" onClose={close} width={390}>
        <div style={{marginBottom:14}}><label style={lbl}>เครื่องดื่ม</label><select value={sForm.productId} onChange={e=>setSForm({...sForm,productId:parseInt(e.target.value)})} style={inp}>{pr.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={lbl}>ช่องทางการขาย</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{ch.map(c=><button key={c.id} onClick={()=>setSForm({...sForm,channelId:c.id})} style={{padding:"9px 12px",borderRadius:10,border:sForm.channelId===c.id?`2px solid ${c.color}`:"1px solid #d5c5b0",background:sForm.channelId===c.id?c.color+"18":"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:sForm.channelId===c.id?700:400,color:sForm.channelId===c.id?c.color:"#3a2e1e"}}><ChannelGlyph c={c} size={18}/>{c.name}</button>)}</div></div>
        {saleProd&&sForm.channelId&&<div style={{background:"#fef9f0",borderRadius:10,padding:12,marginBottom:14,border:"1px solid #e8d8c0",display:"flex",alignItems:"center",gap:12}}>
          {saleProd.image
            ? <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0}}><img src={saleProd.image} alt={saleProd.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
            : <span style={{fontSize:28}}>{saleProd.emoji}</span>
          }<div><div style={{fontSize:13,fontWeight:700}}>{saleProd.name}</div><div style={{fontSize:12,color:"#8b7060"}}>ราคามาตรฐาน <ChannelGlyph c={ch.find(c=>c.id===sForm.channelId)} size={14}/> {ch.find(c=>c.id===sForm.channelId)?.name}: <b style={{color:ch.find(c=>c.id===sForm.channelId)?.color,fontSize:14}}>฿{saleDefaultUnit}</b></div></div></div>}
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr",gap:12,marginBottom:18}}>
          <div><label style={lbl}>จำนวน (แก้ว)</label><input type="number" min="1" value={sForm.qty} onChange={e=>setSForm({...sForm,qty:e.target.value})} style={{...inp,fontSize:20,fontWeight:700,textAlign:"center"}}/></div>
          <div><label style={lbl}>ราคา/แก้ว (฿)</label><input type="number" value={sForm.unitPrice} onChange={e=>setSForm({...sForm,unitPrice:e.target.value})} placeholder={String(saleDefaultUnit||0)} style={{...inp,fontSize:18,fontWeight:700,textAlign:"center"}}/></div>
          <div><label style={lbl}>วันที่</label><input type="date" value={sForm.date} onChange={e=>setSForm({...sForm,date:e.target.value})} style={inp}/></div>
        </div>
        <div style={{background:"linear-gradient(135deg,#e8f7ef,#d0edd9)",borderRadius:10,padding:"12px 16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,color:"#5a8a70"}}>ยอดรวม</span><span style={{fontSize:22,fontWeight:700,color:"#2d7a4f"}}>฿{saleTotal.toLocaleString()}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={close} style={sec}>ยกเลิก</button><button onClick={saveSale} style={pri}>✅ บันทึก</button></div>
      </Modal>}

      {modal==="exp"&&<Modal title="เพิ่มรายจ่าย" onClose={close} width={360}>
        <div style={{marginBottom:14}}><label style={lbl}>หมวดหมู่</label><select value={eForm.category} onChange={e=>setEForm({...eForm,category:e.target.value})} style={inp}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={lbl}>รายละเอียด</label><input value={eForm.description} onChange={e=>setEForm({...eForm,description:e.target.value})} placeholder="เช่น ชา นม น้ำตาล" style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
          <div><label style={lbl}>จำนวนเงิน (฿)</label><input type="number" value={eForm.amount} onChange={e=>setEForm({...eForm,amount:e.target.value})} placeholder="0" style={inp}/></div>
          <div><label style={lbl}>วันที่</label><input type="date" value={eForm.date} onChange={e=>setEForm({...eForm,date:e.target.value})} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={close} style={sec}>ยกเลิก</button><button onClick={saveExp} style={pri}>💾 บันทึก</button></div>
      </Modal>}

      {modal==="editExp"&&editExp&&<Modal title="แก้ไขรายจ่าย" onClose={close} width={360}>
        <div style={{marginBottom:14}}><label style={lbl}>หมวดหมู่</label><select value={eForm.category} onChange={e=>setEForm({...eForm,category:e.target.value})} style={inp}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={lbl}>รายละเอียด</label><input value={eForm.description} onChange={e=>setEForm({...eForm,description:e.target.value})} style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><label style={lbl}>จำนวนเงิน (฿)</label><input type="number" value={eForm.amount} onChange={e=>setEForm({...eForm,amount:e.target.value})} style={inp}/></div>
          <div><label style={lbl}>วันที่</label><input type="date" value={eForm.date} onChange={e=>setEForm({...eForm,date:e.target.value})} style={inp}/></div>
        </div>
        {/* Delete option */}
        <div style={{background:"#fdecea",borderRadius:10,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#c0392b"}}>ต้องการลบรายการนี้?</span>
          <button onClick={()=>{if(window.confirm("ยืนยันลบรายการนี้?"))setExpenses(prev=>prev.filter(x=>x.id!==editExp.id));close();}} style={{background:"#c0392b",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🗑️ ลบ</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={close} style={sec}>ยกเลิก</button>
          <button onClick={()=>{setExpenses(prev=>prev.map(x=>x.id===editExp.id?{...x,...eForm,amount:parseFloat(eForm.amount)||0}:x));close();}} style={pri}>💾 บันทึก</button>
        </div>
      </Modal>}
    </div>
  );
}
