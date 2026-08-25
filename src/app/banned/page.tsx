"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BannedPage(){
  const router=useRouter();
  async function signOut(){await supabase.auth.signOut();router.replace("/login");}
  return <main className="authPage"><div className="authCard"><div className="authLogo"><span>✦</span> MagicQuestions</div><h1>Account suspended</h1><p className="authSub">This account has been disabled by the MagicQuestions owner. If you think this is a mistake, contact support.</p><button className="generate" onClick={signOut}>Log out</button></div></main>;
}
