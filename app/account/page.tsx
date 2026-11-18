"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router=useRouter();
  const [mode,setMode]=useState<"login"|"register">("register");
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const endpoint=mode==="register"?"/api/v1/auth/register":"/api/v1/auth/login";
      const payload=mode==="register"?{displayName:name,email,password}:{email,password};
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر إتمام العملية");
      router.push("/profile");
    }catch(error){setMessage(error instanceof Error?error.message:"حدث خطأ");}
    finally{setBusy(false);}
  }
  return <main className="account-shell"><header className="account-top"><a href="/" className="brand">GAME<span>VERSE</span></a><a href="/games">العودة للألعاب</a></header><section className="account-card"><span className="eyebrow">GAMEVERSE ACCOUNT</span><h1>{mode==="register"?"أنشئ حسابك وابدأ اللعب":"مرحباً بعودتك"}</h1><p>احفظ ألعابك المفضلة، وتابع سجل اللعب والتقييمات من حساب واحد.</p><div className="account-tabs"><button className={mode==="register"?"selected":""} onClick={()=>setMode("register")}>حساب جديد</button><button className={mode==="login"?"selected":""} onClick={()=>setMode("login")}>تسجيل الدخول</button></div><form onSubmit={submit}>{mode==="register"&&<label>الاسم الظاهر<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>}<label>البريد الإلكتروني<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required minLength={mode==="register"?10:1} maxLength={128} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="account-submit" disabled={busy}>{busy?"جارٍ التنفيذ...":mode==="register"?"إنشاء حساب لاعب":"تسجيل الدخول"}</button></form>{message&&<p className="account-error">{message}</p>}<p className="account-note">حسابات اللاعبين تبدأ بصلاحية لاعب. طلب صلاحية المطوّر يتم من بوابة المطوّرين.</p></section></main>;
}
