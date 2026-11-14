import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export async function POST(request:NextRequest){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return NextResponse.json({error:'Sign in to use the paper marker.'},{status:401});
 const db=createClient('https://lrrlwilhbubyjwiyytsj.supabase.co','sb_publishable_fGESICDpU45dU5un7M4ntw_FUrb8yDE',{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.getUser(token);
 if(error||!data.user)return NextResponse.json({error:'Your session has expired.'},{status:401});
 // Intentional release gate: do not call an AI or invent results before calibration.
 return NextResponse.json({error:'AI grading is not released. Model configuration and human-marked validation are required. Your saved submissions remain available.',code:'MARKING_NOT_RELEASED'},{status:503});
}
