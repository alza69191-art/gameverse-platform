"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Review={id:number;rating:number;reviewText:string|null;displayName:string;createdAt:string};
type Comment={id:number;parentId:number|null;body:string;displayName:string;createdAt:string};

export default function GameCommunity({slug}:{slug:string}){
  const [signedIn,setSignedIn]=useState(false);
  const [favorite,setFavorite]=useState(false);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [comments,setComments]=useState<Comment[]>([]);
  const [average,setAverage]=useState<number|null>(null);
  const [count,setCount]=useState(0);
  const [rating,setRating]=useState(5);
  const [reviewText,setReviewText]=useState("");
  const [comment,setComment]=useState("");
  const [reportReason,setReportReason]=useState("broken");
  const [reportDetails,setReportDetails]=useState("");
  const [message,setMessage]=useState("");

  async function refresh(){
    const [me,rev,com,favs]=await Promise.all([
      fetch("/api/v1/auth/me",{cache:"no-store"}).then(r=>r.json()),
      fetch(`/api/v1/games/${slug}/reviews`,{cache:"no-store"}).then(r=>r.json()),
      fetch(`/api/v1/games/${slug}/comments`,{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/v1/users/me/favorites",{cache:"no-store"})
    ]);
    setSignedIn(Boolean(me.user));
    setReviews(rev.reviews??[]);setAverage(rev.summary?.averageRating==null?null:Number(rev.summary.averageRating));setCount(Number(rev.summary?.ratingCount??0));
    setComments(com.comments??[]);
    if(me.user&&favs.ok){const data=await favs.json();setFavorite((data.favorites??[]).some((x:{slug:string})=>x.slug===slug));}
    else setFavorite(false);
  }
  useEffect(()=>{refresh().catch(()=>setMessage("تعذر تحميل التفاعل المجتمعي"));},[slug]);
  useEffect(()=>{
    if(!signedIn)return;
    let activeSince:number|null=document.visibilityState==="visible"?Date.now():null;
    let accumulated=0;
    const flush=()=>{
      if(activeSince!==null){accumulated+=Math.floor((Date.now()-activeSince)/1000);activeSince=document.visibilityState==="visible"?Date.now():null;}
      if(accumulated>=10){
        const durationSeconds=Math.min(accumulated,7200);accumulated=0;
        fetch(`/api/v1/games/${slug}/play`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({durationSeconds}),keepalive:true}).catch(()=>{});
      }
    };
    const onVisibility=()=>{if(document.visibilityState==="hidden")flush();else if(activeSince===null)activeSince=Date.now();};
    const timer=window.setInterval(flush,300000);
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("pagehide",flush);
    return()=>{flush();window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisibility);window.removeEventListener("pagehide",flush);};
  },[signedIn,slug]);


  async function send(url:string,body:unknown,success:string){
    setMessage("");
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json();if(!r.ok){setMessage(data.error||"تعذر تنفيذ الطلب");return false;}
    setMessage(success);return true;
  }
  async function submitReview(e:FormEvent){e.preventDefault();if(await send(`/api/v1/games/${slug}/reviews`,{rating,reviewText},"تم إرسال تقييمك للمراجعة.")){setReviewText("");}}
  async function submitComment(e:FormEvent){e.preventDefault();if(await send(`/api/v1/games/${slug}/comments`,{body:comment},"تم إرسال تعليقك للمراجعة.")){setComment("");}}
  async function submitReport(e:FormEvent){e.preventDefault();if(await send(`/api/v1/games/${slug}/reports`,{reason:reportReason,details:reportDetails},"تم استلام بلاغك.")){setReportDetails("");}}
  async function toggleFavorite(){
    const r=await fetch(`/api/v1/games/${slug}/favorite`,{method:favorite?"DELETE":"POST"});
    const data=await r.json();if(!r.ok){setMessage(data.error||"سجّل الدخول أولاً");return;}setFavorite(!favorite);
  }

  return <section className="community">
    <div className="community-head"><div><span className="eyebrow">GAMEVERSE COMMUNITY</span><h2>تقييمات وآراء اللاعبين</h2><p>{average===null?"لا توجد تقييمات معتمدة بعد":`متوسط التقييم ${average} من 5 · ${count} تقييم`}</p></div><button className="favorite-button" onClick={toggleFavorite}>{favorite?"♥ أزل من المفضلة":"♡ أضف للمفضلة"}</button></div>
    {message&&<p className="community-message">{message}</p>}
    {!signedIn&&<p className="community-login">للتقييم والتعليق والإبلاغ، <Link href="/account">سجّل الدخول</Link>.</p>}
    {signedIn&&<div className="community-forms"><form onSubmit={submitReview}><h3>قيّم اللعبة</h3><label>تقييمك<select value={rating} onChange={e=>setRating(Number(e.target.value))}><option value={5}>5 - ممتازة</option><option value={4}>4 - جيدة جداً</option><option value={3}>3 - جيدة</option><option value={2}>2 - ضعيفة</option><option value={1}>1 - سيئة</option></select></label><textarea maxLength={2000} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="اكتب رأيك (اختياري)" /><button>إرسال التقييم</button></form>
    <form onSubmit={submitComment}><h3>أضف تعليقاً</h3><textarea required minLength={2} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)} placeholder="شارك تجربتك مع اللاعبين..." /><button>إرسال التعليق</button></form></div>}
    <div className="community-lists"><div><h3>التقييمات المعتمدة</h3>{reviews.length?reviews.map(r=><article className="community-item" key={r.id}><b>{r.displayName}</b><span>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>{r.reviewText&&<p>{r.reviewText}</p>}</article>):<p className="community-muted">لا توجد تقييمات ظاهرة بعد.</p>}</div><div><h3>التعليقات المعتمدة</h3>{comments.length?comments.map(c=><article className="community-item" key={c.id}><b>{c.displayName}</b><p>{c.body}</p></article>):<p className="community-muted">لا توجد تعليقات ظاهرة بعد.</p>}</div></div>
    {signedIn&&<details className="report-box"><summary>الإبلاغ عن مشكلة أو مخالفة</summary><form onSubmit={submitReport}><label>سبب البلاغ<select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="broken">اللعبة لا تعمل</option><option value="malware">اشتباه بملف ضار</option><option value="copyright">حقوق ملكية</option><option value="inappropriate">محتوى غير مناسب</option><option value="other">سبب آخر</option></select></label><textarea required minLength={10} maxLength={2000} value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="اشرح المشكلة..." /><button>إرسال البلاغ</button></form></details>}
  </section>;
}
