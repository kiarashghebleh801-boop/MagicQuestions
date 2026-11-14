import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MarkerError, markerState, runMarker } from '@/lib/markerGemini.server';
export const runtime='nodejs';
export const maxDuration=60;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request:NextRequest){
 const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return json({error:'Sign in to use the paper marker.'},401);
 const db=createClient('https://lrrlwilhbubyjwiyytsj.supabase.co','sb_publishable_fGESICDpU45dU5un7M4ntw_FUrb8yDE',{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.getUser(token);if(error||!data.user)return json({error:'Your session has expired. Sign in again.'},401);
 try{
  const bodyText=await request.text();if(bodyText.length>250000)return json({error:'This request is too large.'},413);
  let body;try{body=JSON.parse(bodyText);}catch{return json({error:'Invalid marking request.'},400);}
  if(!body||!uuid.test(body.sessionId)||!['history','criteria','transcribe','mark'].includes(body.action))return json({error:'Choose a saved marking session and valid step.'},400);
  const r=await db.from('marker_sessions').select('*').eq('id',body.sessionId).eq('user_id',data.user.id).single();if(r.error||!r.data)return json({error:'This marking session was not found.'},404);
  if(body.action==='history')return json(await markerState(db,r.data));
  if(body.adultConfirmed!==true)return json({error:'An adult parent or teacher must confirm authorisation before sending documents to Gemini.'},400);
  if(r.data.status!=='verified')return json({error:'Finish uploading and verifying this submission first.'},400);
  return json(await runMarker(db,r.data,body.action,body.corrections));
 }catch(e){return json({error:e instanceof MarkerError?e.message:e instanceof Error&&/AI response|mark|criterion|label|answer|scheme|question|allocation|review flag|structured|transcription/i.test(e.message)?e.message:'The marking step failed. Your submission is retained; retry later.'},e instanceof MarkerError?e.status:422);}
}
