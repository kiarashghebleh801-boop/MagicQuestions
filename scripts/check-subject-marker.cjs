const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict'),Module=require('module');
const original=Module._resolveFilename;Module._resolveFilename=function(id,...args){return original.call(this,id.startsWith('@/')?path.resolve(__dirname,'../src',id.slice(2)):id,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Workspace=require('../src/components/SubjectWorkspace.tsx').default;
for(const subject of ['Chemistry','Physics','Biology','Mathematics']){
 const props={subject,email:'',onModeChange:()=>{},questionCount:10,markerPaper:[]};
 const render=mode=>renderToStaticMarkup(React.createElement(Workspace,{...props,mode},React.createElement('div',{'data-testid':'existing-tools'},'EXISTING_TRACKER_CONTENT')));
 const marker=render('marker');assert.ok(marker.includes('Save private submission'));assert.ok(marker.includes('Gemini marking'));assert.ok(!marker.includes('EXISTING_TRACKER_CONTENT'));assert.ok(marker.includes(subject+' marking history'));
 for(const mode of ['generate','bank','tracker'])assert.ok(render(mode).includes('EXISTING_TRACKER_CONTENT'));
 assert.ok(!render('resources').includes('Save private submission'));assert.ok(!render('notes').includes('Save private submission'));
}
console.log('PASS: marker renders its upload workspace in all four subjects, hides generator/tracker content, and preserves existing tab rendering.');
