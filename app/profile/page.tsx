"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { browserGames } from "@/lib/catalog";

type User={id:string;email:string;displayName:string;role:string};
type Notification={id:number;type:string;title:string;body:string;readAt:string|null;createdAt:string};
type History={slug:string;totalSeconds:number;lastPlayed:string;sessions:number};

export default function ProfilePage(){
  const router=useRouter();
  const [user,setUser]=useState<User|null>(null);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [history,setHistory]=useState<History[]>([]);
  const [notifications,setNotifications]=useState<Notification[]>([]);
  const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    const me=await fetch("/api/v1/auth/me",{cache:"no-store"}).then(r=>r.json());
    if(!me.user){router.replace("/account");return;}
    setUser(me.user);
    const [f,h,n]=await Promise.all([
      fetch("/api/v1/users/me/favorites",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/v1/users/me/history",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/v1/users/me/notifications",{cache:"no-store"}).then(r=>r.json())
    ]);
    setFavorites((f.favorites??[]).map((x:{slug:string})=>x.slug));
    setHistory(h.history??[]);
    setNotifications(n.notifications??[]);
  },[router]);
  useEffect(()=>{load().catch(()=>setMessage("تعذر تحميل بيانات الحساب"));},[load]);
  async function markRead(id:number){
    const r=await fetch("/api/v1/users/me/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(r.ok)setNotifications(items=>items.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n));
  }
  async function logout(){await fetch("/api/v1/auth/logout",{method:"POST"});router.replace("/account");}
  const gameTitle=(slug:string)=>browserGames.find(g=>g.slug===slug)?.title??slug;
  if(!user)return <main className="profile-shell"><p>جارٍ تحميل الحساب...</p></main>;
  return <main className="profile-shell"><header className="account-top"><Link href="/" className="brand">GAME<span>VERSE</span></Link><div><span>{user.displayName}</span><button onClick={logout}>خروج</button></div></header><section className="profile-hero"><span className="eyebrow">PLAYER PROFILE</span><h1>مرحباً، {user.displayName}</h1><p>{user.email} · {user.role==="developer"?"مطوّر معتمد":user.role==="admin"?"مدير":"لاعب"}</p><Link href="/games" className="account-submit">اكتشف ألعاباً جديدة</Link></section>{message&&<p className="account-error">{message}</p>}
  <div className="profile-grid"><section className="profile-panel"><h2>ألعابي المفضلة</h2>{favorites.length?favorites.map(slug=><Link key={slug} href={"/play/"+slug} className="profile-row"><span>{gameTitle(slug)}</span><span>افتح اللعبة ←</span></Link>):<p className="account-note">لم تضف ألعاباً للمفضلة بعد.</p>}</section>
  <section className="profile-panel"><h2>سجل اللعب</h2>{history.length?history.map(item=><Link key={item.slug} href={"/play/"+item.slug} className="profile-row"><span>{gameTitle(item.slug)}</span><small>{Math.round(Number(item.totalSeconds)/60)} دقيقة · {item.sessions} جلسة</small></Link>):<p className="account-note">سيظهر سجل اللعب هنا بعد تسجيل الدخول وتشغيل الألعاب.</p>}</section>
  <section className="profile-panel wide"><h2>الإشعارات</h2>{notifications.length?notifications.map(n=><article className={"notification "+(n.readAt?"read":"")} key={n.id}><div><b>{n.title}</b><p>{n.body}</p><small>{new Date(n.createdAt).toLocaleString("ar")}</small></div>{!n.readAt&&<button onClick={()=>markRead(n.id)}>تمت القراءة</button>}</article>):<p className="account-note">لا توجد إشعارات حالياً.</p>}</section></div></main>;
}
