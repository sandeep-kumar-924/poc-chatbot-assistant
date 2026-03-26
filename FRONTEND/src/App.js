import React, { useState, useRef, useEffect } from "react";
import Plot from "react-plotly.js";

const SUGGESTIONS = [
  "Which customers haven't placed any order?",
  "Top 5 customers by total spend",
  "Products low on stock (< 10 units)",
  "Monthly revenue for this year",
  "Most sold products by quantity",
  "Recent 10 invoices with customer names",
  "Revenue breakdown by product category",
  "Average order value by payment method",
];

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:{fontFamily:"'IBM Plex Sans',sans-serif",background:"#0f1117",minHeight:"100vh",display:"flex",flexDirection:"column",color:"#e2e8f0"},
  header:{borderBottom:"1px solid #1e2433",padding:"14px 24px",display:"flex",alignItems:"center",gap:12,background:"#0f1117"},
  headerDot:{width:8,height:8,borderRadius:"50%",background:"#22c55e"},
  headerTitle:{fontSize:15,fontWeight:600,color:"#f1f5f9"},
  headerBadge:{marginLeft:"auto",fontSize:11,padding:"2px 10px",borderRadius:99,background:"#1e2433",color:"#64748b",border:"1px solid #2d3748"},
  body:{flex:1,display:"flex",overflow:"hidden",marginLeft:220},
  sidebar:{width:220,borderRight:"1px solid #1e2433",padding:"16px 12px",display:"flex",flexDirection:"column",gap:6,overflowY:"auto",flexShrink:0,position:"fixed",top:49,left:0,bottom:0,overflowY:"auto"},
  sidebarLabel:{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,paddingLeft:8},
  suggestion:{fontSize:12,padding:"7px 10px",borderRadius:6,color:"#64748b",cursor:"pointer",border:"1px solid transparent",background:"transparent",textAlign:"left",lineHeight:1.4,fontFamily:"'IBM Plex Sans',sans-serif"},
  chat:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  messages:{flex:1,overflowY:"auto",padding:"24px",display:"flex",flexDirection:"column",gap:20},
  userMsg:{alignSelf:"flex-end",maxWidth:"70%"},
  userBubble:{background:"#1a56db",color:"#fff",padding:"10px 16px",borderRadius:"14px 14px 4px 14px",fontSize:14,lineHeight:1.5},
  botMsg:{alignSelf:"flex-start",maxWidth:"85%"},
  botLabel:{fontSize:11,color:"#475569",marginBottom:4,display:"flex",alignItems:"center",gap:6},
  botDot:{width:6,height:6,borderRadius:"50%",background:"#22c55e"},
  botBubble:{background:"#161b27",border:"1px solid #1e2433",borderRadius:"4px 14px 14px 14px",padding:"12px 16px",fontSize:14,lineHeight:1.6,color:"#cbd5e1"},
  sqlBlock:{marginTop:10,background:"#0a0d14",border:"1px solid #1e2433",borderRadius:8,overflow:"hidden"},
  sqlHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",borderBottom:"1px solid #1e2433",background:"#0f1117"},
  sqlLabel:{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em"},
  copyBtn:{fontSize:11,color:"#475569",background:"transparent",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4,fontFamily:"'IBM Plex Sans',sans-serif"},
  sqlCode:{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#7dd3fc",padding:"10px 14px",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0},
  tableWrap:{marginTop:10,border:"1px solid #1e2433",borderRadius:8,overflow:"auto",maxHeight:280},
  table:{width:"100%",borderCollapse:"collapse",fontSize:12},
  th:{padding:"7px 12px",textAlign:"left",background:"#0f1117",color:"#475569",fontWeight:500,fontSize:11,borderBottom:"1px solid #1e2433",whiteSpace:"nowrap"},
  td:{padding:"7px 12px",color:"#94a3b8",borderBottom:"1px solid #1a2030",whiteSpace:"nowrap"},
  rowCount:{fontSize:11,color:"#475569",marginTop:6,paddingLeft:2},
  errBox:{marginTop:8,background:"#1a0a0a",border:"1px solid #3b1212",borderRadius:6,padding:"8px 12px",fontSize:12,color:"#f87171",fontFamily:"'IBM Plex Mono',monospace"},
  inputArea:{borderTop:"1px solid #1e2433",padding:"14px 24px",display:"flex",gap:10},
  input:{flex:1,background:"#161b27",border:"1px solid #2d3748",borderRadius:8,padding:"10px 14px",fontSize:14,color:"#e2e8f0",outline:"none",fontFamily:"'IBM Plex Sans',sans-serif"},
  sendBtn:{padding:"10px 20px",borderRadius:8,border:"none",background:"#1a56db",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer"},
  typing:{display:"flex",gap:4,alignItems:"center",padding:"10px 14px"},
};

// ── Sub-components ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={S.typing}>
      {[0,1,2].map(i=>(
        <span key={i} style={{width:6,height:6,borderRadius:"50%",background:"#475569",display:"inline-block",
          animation:`blink 1.2s ${i*0.2}s infinite`}}/>
      ))}
      <style>{`@keyframes blink{0%,80%,100%{opacity:0.2}40%{opacity:1}}`}</style>
    </div>
  );
}

function SqlBlock({sql}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(sql);setCopied(true);setTimeout(()=>setCopied(false),1500)};
  return(
    <div style={S.sqlBlock}>
      <div style={S.sqlHeader}>
        <span style={S.sqlLabel}>Generated SQL</span>
        <button style={S.copyBtn} onClick={copy}>{copied?"Copied!":"Copy"}</button>
      </div>
      <pre style={S.sqlCode}>{sql}</pre>
    </div>
  );
}

function ResultTable({columns,rows}){
  if(!columns.length) return null;
  return(
    <>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead><tr>{columns.map(c=><th key={c} style={S.th}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={i} style={{background:i%2===0?"#161b27":"#0f1420"}}>
                {columns.map(c=>(
                  <td key={c} style={S.td}>
                    {row[c]===null?<span style={{color:"#374151"}}>NULL</span>:String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.rowCount}>{rows.length} row{rows.length!==1?"s":""} returned</div>
    </>
  );
}

function ChartView({columns,rows}){
  try{
    if(!columns.length||!rows.length) return null;

    // Detect numeric and categorical columns
    const numCols=columns.filter(c=>rows.some(r=>{
      const v=r[c];
      return typeof v==="number"||(typeof v==="string"&&!isNaN(v)&&v.trim()!=="");
    }));
    const catCols=columns.filter(c=>!numCols.includes(c));
    
    if(!numCols.length||!catCols.length) return null;

    const xCol=catCols[0];
    const yCol=numCols[0];

    // Convert string numbers to actual numbers
    const trace={
      x:rows.map(r=>String(r[xCol])),
      y:rows.map(r=>{
        const v=r[yCol];
        return typeof v==="number"?v:parseFloat(v);
      }),
      type:"bar",
      marker:{color:"#1a56db"},
      name:yCol,
    };

    return(
      <div style={{marginTop:16,border:"1px solid #1e2433",borderRadius:8,overflow:"hidden",background:"#0a0d14",padding:"12px"}}>
        <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Chart View</div>
        <Plot
          data={[trace]}
          layout={{
            title:`${yCol} by ${xCol}`,
            xaxis:{showgrid:false,color:"#475569",title:{text:xCol,font:{size:12,color:"#475569"}}},
            yaxis:{showgrid:true,gridcolor:"#1e2433",color:"#475569",title:{text:yCol,font:{size:12,color:"#475569"}}},
            plot_bgcolor:"#0f1420",
            paper_bgcolor:"#0a0d14",
            font:{color:"#cbd5e1",size:11},
            margin:{l:50,r:20,t:40,b:40},
            height:320,
          }}
          style={{width:"100%"}}
          config={{responsive:true,displayModeBar:false}}
        />
      </div>
    );
  }catch(err){
    console.error("Chart error:",err);
    return null;
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [messages,setMessages]=useState([]);
  const [history,setHistory]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [hovered,setHovered]=useState(null);
  const bottomRef=useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"})},[messages,loading]);

  const send=async(text)=>{
    const q=text||input.trim();
    if(!q||loading) return;
    setInput(""); setLoading(true);
    const newHistory=[...history,{role:"user",content:q}];
    setHistory(newHistory);
    setMessages(prev=>[...prev,{role:"user",text:q}]);
    try{
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newHistory}),
      });
      const data=await res.json();
      setHistory(h=>[...h,{role:"assistant",content:data.answer||""}]);
      setMessages(prev=>[...prev,{
        role:"bot",answer:data.answer,sql:data.sql,
        columns:data.columns||[],rows:data.rows||[],dbError:data.dbError
      }]);
    }catch(err){
      setMessages(prev=>[...prev,{role:"bot",answer:"Request failed: "+err.message,sql:null,columns:[],rows:[]}]);
    }
    setLoading(false);
  };

  return(
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.headerDot}/>
        <span style={S.headerTitle}>POC Chat Assistant</span>
        <span style={S.headerBadge}>PostgreSQL · cts schema</span>
      </div>
      <div style={S.body}>
        <div style={S.sidebar}>
          <div style={S.sidebarLabel}>Suggestions</div>
          {SUGGESTIONS.map((s,i)=>(
            <button key={i} style={{...S.suggestion,
              background:hovered===i?"#1e2433":"transparent",
              border:hovered===i?"1px solid #2d3748":"1px solid transparent",
              color:hovered===i?"#cbd5e1":"#64748b"}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
              onClick={()=>send(s)}>{s}</button>
          ))}
        </div>
        <div style={S.chat}>
          <div style={S.messages}>
            {messages.length===0&&(
              <div style={{margin:"auto",textAlign:"center",color:"#2d3748"}}>
                <div style={{fontSize:40,marginBottom:12}}>🗄️</div>
                <div style={{fontSize:15,color:"#475569"}}>Ask a question about your data</div>
              </div>
            )}
            {messages.map((msg,i)=>
              msg.role==="user"?(
                <div key={i} style={S.userMsg}><div style={S.userBubble}>{msg.text}</div></div>
              ):(
                <div key={i} style={S.botMsg}>
                  <div style={S.botLabel}><div style={S.botDot}/>CTS Assistant</div>
                  <div style={S.botBubble}>
                    <div>{msg.answer}</div>
                    {msg.sql&&<SqlBlock sql={msg.sql}/>}
                    {msg.dbError&&<div style={S.errBox}>DB Error: {msg.dbError}</div>}
                    {msg.columns?.length>0&&<ChartView columns={msg.columns} rows={msg.rows}/>}
                    {msg.columns?.length>0&&<ResultTable columns={msg.columns} rows={msg.rows}/>}
                  </div>
                </div>
              )
            )}
            {loading&&(
              <div style={S.botMsg}>
                <div style={S.botLabel}><div style={S.botDot}/>CTS Assistant</div>
                <div style={S.botBubble}><TypingDots/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <div style={S.inputArea}>
            <input style={S.input} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask a question about your data…"
              disabled={loading}/>
            <button style={{...S.sendBtn,opacity:loading?.5:1}} onClick={()=>send()} disabled={loading}>
              {loading?"…":"Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}