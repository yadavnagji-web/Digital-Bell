const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUNDLE_PATH_1 = path.join(ROOT_DIR, 'raw_web', 'assets', 'index-BVS57iLR.js');
const BUNDLE_PATH_2 = path.join(ROOT_DIR, 'raw_web', 'index-BVS57iLR.js');
const BAK_PATH = path.join(ROOT_DIR, 'raw_web', 'assets', 'index-BVS57iLR.js.bak');

// Always start clean from pristine backup
const pristineBundle = fs.readFileSync(BAK_PATH, 'utf-8');

const startTarget = 'MC=()=>{';
const startIdx = pristineBundle.indexOf(startTarget);
if (startIdx === -1) {
  throw new Error('startTarget (MC=()=>{) not found in pristine bundle');
}

const endTarget = 'jC=()=>';
const endIdx = pristineBundle.indexOf(endTarget, startIdx);
if (endIdx === -1) {
  throw new Error('endTarget (jC) not found in pristine bundle');
}

console.log('Replacing MC from', startIdx, 'to', endIdx);

const newMCCode = `MC=()=>{
  const getInitialSeason=()=>{
    const m=new Date().getMonth();
    return(m>=3&&m<=8)?"summer":"winter";
  };

  const b=W=>{
    const V=W.getHours().toString().padStart(2,"0");
    const oe=W.getMinutes().toString().padStart(2,"0");
    return\`\${V}:\${oe}\`;
  };

  const N=W=>{
    let V=W.getHours();
    const oe=W.getMinutes().toString().padStart(2,"0");
    const xe=W.getSeconds().toString().padStart(2,"0");
    const me=V>=12?"PM":"AM";
    V=V%12;
    V=V||12;
    return\`\${V.toString().padStart(2,"0")}:\${oe}:\${xe} \${me}\`;
  };

  const I=W=>{
    const[V,oe]=W.split(":").map(Number);
    const xe=V>=12?"PM":"AM";
    let me=V%12;
    me=me||12;
    return\`\${me.toString().padStart(2,"0")}:\${oe.toString().padStart(2,"0")} \${xe}\`;
  };

  const Q=W=>{
    const V=W.getDate();
    const oe=RC[W.getMonth()];
    const xe=W.getFullYear();
    const me=NC[W.getDay()];
    return\`\${V} \${oe} \${xe} | \${me}\`;
  };

  const normalizeSchedule=(arr,defArr)=>{
    if(!Array.isArray(arr)||arr.length===0) return defArr;
    return arr.map(i=>{
      const c=typeof i.ringCount==='number'?i.ringCount:(typeof i.count==='number'?i.count:1);
      return {...i,count:c,ringCount:c};
    });
  };

  const getStrikeCount=item=>{
    if(!item) return 1;
    if(typeof item.ringCount==='number') return item.ringCount;
    if(typeof item.count==='number') return item.count;
    return 1;
  };

  // 1. Initial State from localStorage (Persisted across restarts)
  const initialPersisted=(()=>{
    try{
      const raw=localStorage.getItem('digital_bell_master_settings');
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return null;
  })();

  const initialNow=new Date();
  const[e,t]=y.useState(initialPersisted&&initialPersisted.selectedSeason?initialPersisted.selectedSeason:getInitialSeason);
  const[n,r]=y.useState(!0); // auto-running
  const[o,i]=y.useState(!0); // audio unlocked
  const[s,l]=y.useState(N(initialNow));
  const[a,u]=y.useState(initialNow);
  const[c,f]=y.useState(!1);
  const[p,d]=y.useState(null);
  const[x,g]=y.useState("🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)");
  const[w,m]=y.useState(!1);
  const[h,v]=y.useState(-1);
  const[E,C]=y.useState(normalizeSchedule(initialPersisted&&initialPersisted.summerSchedule, Df));
  const[T,k]=y.useState(normalizeSchedule(initialPersisted&&initialPersisted.winterSchedule, Ff));
  const[R,M]=y.useState(null);
  const[_,z]=y.useState("");
  const[vol,setVol]=y.useState(initialPersisted&&typeof initialPersisted.volume==='number'?initialPersisted.volume:1.0);
  const[soundType,setSoundType]=y.useState(initialPersisted&&initialPersisted.soundType?initialPersisted.soundType:"real_brass");
  const[saveMsg,setSaveMsg]=y.useState("");
  const[activeTestRow,setActiveTestRow]=y.useState(null);

  const j=y.useRef(null);
  const H=y.useRef(null);
  const L=y.useRef("");
  const U=y.useRef(null);
  const F=y.useRef(null);

  const B=e==="summer"?E:T;

  const $=y.useCallback(W=>{
    const[V,oe]=W.split(":").map(Number);
    const xe=V*60+oe;
    for(let me=B.length-1;me>=0;me--){
      const[hn,Yt]=B[me].time.split(":").map(Number);
      const ki=hn*60+Yt;
      if(xe>=ki)return me;
    }
    return-1;
  },[B]);

  // Audio helper: Stop any playing sound
  const stopAllAudio=y.useCallback(()=>{
    if(U.current){clearTimeout(U.current);clearInterval(U.current);U.current=null;}
    if(F.current){clearTimeout(F.current);F.current=null;}
    if(j.current){j.current.pause();j.current.currentTime=0;}
    if(H.current){H.current.pause();H.current.currentTime=0;}
    if(window.__activeAudioInstance){
      try{window.__activeAudioInstance.pause();window.__activeAudioInstance.currentTime=0;}catch(e){}
      window.__activeAudioInstance=null;
    }
    f(!1);
    d(null);
    setActiveTestRow(null);
  },[]);

  // Play Single Strike sound (Authentic Studio Brass Tan Strike)
  const playTanStrike=y.useCallback(()=>{
    try{
      const audio=new Audio(PC);
      audio.volume=vol;
      window.__activeAudioInstance=audio;
      audio.play().catch(e=>console.log("Tan strike audio note:",e));
    }catch(err){
      if(H.current){
        H.current.volume=vol;
        H.current.currentTime=0;
        H.current.play().catch(console.log);
      }
    }
  },[vol]);

  // Play 10-Second Clean Studio Long Bell (Madhyantar, Chutti, Warning - 0 Khar-khar)
  const playClean10sLongBell=y.useCallback(()=>{
    try{
      const audio=new Audio("/assets/chutti_bell.wav");
      audio.volume=vol;
      window.__activeAudioInstance=audio;
      audio.play().catch(e=>{
        console.log("Long bell audio note:",e);
        if(j.current){
          j.current.volume=vol;
          j.current.currentTime=0;
          j.current.play().catch(console.log);
        }
      });
    }catch(err){
      if(j.current){
        j.current.volume=vol;
        j.current.currentTime=0;
        j.current.play().catch(console.log);
      }
    }
  },[vol]);

  // Multi-Ring Multi-Period Orchestrator:
  // 1st Warning = 10s Long + 1 Tan, 2nd Warning = 10s Long + 2 Tan, Periods 1-8 = 1-8 Tan, Chutti = 10s, Madhyantar = 10s
  const de=y.useCallback((ringCount,label,rowIndex=null)=>{
    stopAllAudio();
    f(!0);
    d(label);
    if(typeof rowIndex==='number') setActiveTestRow(rowIndex);

    // 1. First Warning Bell (प्रथम सूचना घंटी): 10s Long Bell + 1 Tan Strike
    if(label&&label.includes("प्रथम सूचना")){
      g("🔔 प्रथम सूचना घंटी - (10 सेकंड लंबी घंटी...)");
      playClean10sLongBell();
      F.current=setTimeout(()=>{
        g("🔔 प्रथम सूचना घंटी - (1 बार टन 🔔)");
        playTanStrike();
        F.current=setTimeout(()=>{
          stopAllAudio();
          g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
        },2800);
      },10500);
      return;
    }

    // 2. Second Warning Bell (द्वितीय सूचना घंटी): 10s Long Bell + 2 Tan Strikes
    if(label&&label.includes("द्वितीय सूचना")){
      g("🔔 द्वितीय सूचना घंटी - (10 सेकंड लंबी घंटी...)");
      playClean10sLongBell();
      F.current=setTimeout(()=>{
        g("🔔 द्वितीय सूचना घंटी - (टन 1/2 🔔)");
        playTanStrike();
        U.current=setTimeout(()=>{
          g("🔔 द्वितीय सूचना घंटी - (टन 2/2 🔔)");
          playTanStrike();
          F.current=setTimeout(()=>{
            stopAllAudio();
            g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
          },2800);
        },1400);
      },10500);
      return;
    }

    const totalStrikes=typeof ringCount==='number'?ringCount:(typeof ringCount==='string'?parseInt(ringCount,10):1);

    if(totalStrikes===0){
      // Chutti - 10 seconds
      g(\`🔔 विद्यालय अवकाश (छुट्टी) - \${label} (10 सेकंड लंबी घंटी)\`);
      playClean10sLongBell();
      F.current=setTimeout(()=>{
        stopAllAudio();
        g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
      },10000);
    }else if(totalStrikes===-1){
      // Madhyantar - 10 seconds
      g(\`🔔 मध्यान्तर (लंच विश्राम) - \${label} (10 सेकंड घंटी)\`);
      playClean10sLongBell();
      F.current=setTimeout(()=>{
        stopAllAudio();
        g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
      },10000);
    }else{
      // Period bell: 1 bar, 2 bar, 3 bar, ..., 8 bar
      const strikes=Math.max(1,totalStrikes||1);
      g(\`🔔 घंटी बज रही है - \${label} (घंटा 1/\${strikes})\`);
      playTanStrike();
      let currentStrike=1;

      if(strikes>1){
        U.current=setInterval(()=>{
          currentStrike++;
          g(\`🔔 घंटी बज रही है - \${label} (घंटा \${currentStrike}/\${strikes})\`);
          playTanStrike();
          if(currentStrike>=strikes){
            if(U.current){clearInterval(U.current);U.current=null;}
            F.current=setTimeout(()=>{
              stopAllAudio();
              g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
            },2500);
          }
        },1500);
      }else{
        F.current=setTimeout(()=>{
          stopAllAudio();
          g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
        },2800);
      }
    }
  },[stopAllAudio,playClean10sLongBell,playTanStrike,n]);

  // Master Save Button Handler (Permanent Persistence)
  const handleMasterSave=async()=>{
    try{
      const payload={
        version:"1.0.0",
        selectedSeason:e,
        summerSchedule:normalizeSchedule(E,Df),
        winterSchedule:normalizeSchedule(T,Ff),
        volume:vol,
        soundType:soundType,
        autoStartOnBoot:!0,
        startMinimized:!0,
        lastSaved:new Date().toLocaleString("hi-IN")
      };

      // 1. Save to LocalStorage
      localStorage.setItem("digital_bell_master_settings",JSON.stringify(payload));

      // 2. Save to Backend Server (/api/settings)
      try{
        await fetch("/api/settings",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        });
      }catch(err){
        console.log("Backend save note:",err);
      }

      setSaveMsg("✅ सेटिंग्स स्थायी रूप से सुरक्षित (Saved & Locked) हो गई हैं!");
      g("✅ सेटिंग्स सुरक्षित! कंप्यूटर बंद होने पर भी यही समय रहेगा");
      setTimeout(()=>{
        setSaveMsg("");
        g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
      },5000);
    }catch(err){
      console.error("Save error:",err);
      setSaveMsg("❌ सेटिंग्स सुरक्षित करने में समस्या आई");
    }
  };

  // Synchronize from backend on startup
  y.useEffect(()=>{
    fetch("/api/settings").then(res=>res.json()).then(data=>{
      if(data){
        if(data.summerSchedule&&Array.isArray(data.summerSchedule)) C(normalizeSchedule(data.summerSchedule,Df));
        if(data.winterSchedule&&Array.isArray(data.winterSchedule)) k(normalizeSchedule(data.winterSchedule,Ff));
        if(data.selectedSeason) t(data.selectedSeason);
        if(typeof data.volume==='number') setVol(data.volume);
        if(data.soundType) setSoundType(data.soundType);
      }
    }).catch(()=>{});
  },[]);

  // Manual Instant Period Bell (Single Strike)
  const fn=()=>{
    de(1,"मैनुअल पीरियड घंटी (1 बार)");
  };

  // Manual Long Bell (Toggle 10s clean bell)
  const ee=()=>{
    if(w){
      stopAllAudio();
      m(!1);
      g(n?"🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)":"घंटी प्रणाली बंद है");
    }else{
      m(!0);
      de(0,"मैनुअल लंबी घंटी (10 सेकंड)");
      setTimeout(()=>m(!1),10000);
    }
  };

  // Start / Stop system
  const jt=()=>{
    r(!0);
    i(!0);
    g("🟢 स्वचालित घंटी प्रणाली सक्रिय (Active)");
  };

  const Er=()=>{
    stopAllAudio();
    r(!1);
    g("🔴 घंटी प्रणाली रोकी गई (PAUSED)");
    L.current="";
  };

  // Edit schedule handlers
  const _t=W=>{M(W);z(B[W].time);};
  const Kt=W=>{
    if(_){
      if(e==="summer"){
        const V=[...E];
        V[W]={...V[W],time:_};
        V.sort((oe,xe)=>oe.time.localeCompare(xe.time));
        C(V);
      }else{
        const V=[...T];
        V[W]={...V[W],time:_};
        V.sort((oe,xe)=>oe.time.localeCompare(xe.time));
        k(V);
      }
      M(null);
      z("");
      setSaveMsg("⚠️ समय बदला गया! स्थायी रखने के लिए 'मास्टर सेटिंग्स सेव' दबाएं");
    }
  };
  const Mt=()=>{M(null);z("");};

  // Reset to default Shivira Panchang schedule
  const pn=()=>{
    if(window.confirm("क्या आप समय-सारणी को सरकारी शिविरा पंचांग के डिफ़ॉल्ट समय पर रीसेट करना चाहते हैं?")){
      e==="summer"?C(normalizeSchedule(Df,Df)):k(normalizeSchedule(Ff,Ff));
      setSaveMsg("⚠️ डिफ़ॉल्ट रीसेट किया गया! इसे स्थायी रखने के लिए 'मास्टर सेटिंग्स सेव' दबाएं");
    }
  };

  // Live countdown to next bell
  const nextBellInfo=(()=>{
    const now=a||new Date();
    const currMin=now.getHours()*60+now.getMinutes();
    const currSec=now.getSeconds();
    for(let idx=0;idx<B.length;idx++){
      const[bh,bm]=B[idx].time.split(":").map(Number);
      const bellMin=bh*60+bm;
      if(bellMin>currMin||(bellMin===currMin&&currSec<10)){
        const diffSec=(bellMin*60)-(currMin*60+currSec);
        const remM=Math.floor(diffSec/60);
        const remS=diffSec%60;
        return{
          item:B[idx],
          remMin:remM,
          remSec:remS,
          time12:I(B[idx].time)
        };
      }
    }
    return null;
  })();

  // Continuous Clock Sync & Bell Triggering
  y.useEffect(()=>{
    return()=>stopAllAudio();
  },[stopAllAudio]);

  y.useEffect(()=>{
    const tick=()=>{
      const now=new Date();
      const hm=b(now);
      const formatted=N(now);
      l(formatted);
      u(now);

      const periodIdx=$(hm);
      v(periodIdx);

      if(n){
        const match=B.find(item=>item.time===hm);
        if(match){
          const ringKey=\`\${now.getFullYear()}-\${now.getMonth()}-\${now.getDate()}_\${hm}_\${match.label}\`;
          if(L.current!==ringKey){
            L.current=ringKey;
            const cnt=getStrikeCount(match);
            console.log(\`[AUTO BELL TRIGGER] At \${hm}: \${match.label} (Strikes: \${cnt})\`);
            de(cnt,match.label);
          }
        }
      }
    };

    tick();
    const timer=setInterval(tick,500);
    const onFocusOrVisible=()=>tick();
    window.addEventListener("focus",onFocusOrVisible);
    document.addEventListener("visibilitychange",onFocusOrVisible);

    return()=>{
      clearInterval(timer);
      window.removeEventListener("focus",onFocusOrVisible);
      document.removeEventListener("visibilitychange",onFocusOrVisible);
    };
  },[n,B,$,de]);

  // Main process trigger receiver
  y.useEffect(()=>{
    window.__triggerAutoBell=(count,lbl)=>{
      console.log("[TRIGGER FROM MAIN PROCESS]",count,lbl);
      de(count,lbl);
    };
    return()=>{delete window.__triggerAutoBell;};
  },[de]);

  return S.jsxs("div",{className:"min-h-screen py-3 px-3 md:px-5",style:{background:"#f0f9ff"},children:[
    S.jsx("audio",{ref:j,src:bC,preload:"auto"}),
    S.jsx("audio",{ref:H,src:PC,preload:"auto"}),

    // Balanced Width Container (Professional dimensions - User Requirement)
    S.jsx("div",{className:"max-w-[1260px] w-full mx-auto relative",children:
      S.jsxs("div",{className:"bg-white rounded-2xl shadow-xl overflow-hidden",style:{border:"2px solid #bae6fd"},children:[

        // Top Saraswati Header
        S.jsxs("div",{className:"p-3 text-center relative overflow-hidden",style:{background:"linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #075985 100%)"},children:[
          S.jsxs("div",{className:"flex items-center justify-between px-2 relative z-10",children:[
            S.jsxs("div",{className:"flex items-center gap-3",children:[
              S.jsx("div",{className:"w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white bg-white flex-shrink-0 shadow",children:
                S.jsx("img",{src:kC,alt:"Maa Saraswati",className:"w-full h-full object-cover"})
              }),
              S.jsxs("div",{className:"text-left",children:[
                S.jsxs("div",{className:"flex items-center gap-1.5 mb-0.5",children:[
                  S.jsx(Ki,{className:"w-3.5 h-3.5 text-amber-300 animate-pulse"}),
                  S.jsx("span",{className:"text-[11px] font-bold tracking-wider uppercase",style:{color:"#fef08a"},children:"Digital School Bell Pro"})
                ]}),
                S.jsx("h1",{className:"text-lg md:text-xl font-bold font-hindi-serif drop-shadow-sm",style:{color:"#ffffff"},children:"स्वचालित विद्यालय घंटी प्रणाली"}),
                S.jsx("p",{className:"text-xs",style:{color:"#e0f2fe"},children:"राजस्थान सरकारी विद्यालय (शिविरा पंचांग नियमानुसार)"})
              ]})
            ]}),
            // Live Status Indicator in Header
            S.jsxs("div",{className:"hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs",style:{background:"rgba(8, 47, 73, 0.6)",border:"1px solid rgba(56, 189, 248, 0.4)"},children:[
              S.jsx("span",{className:\`w-2.5 h-2.5 rounded-full \${n?"bg-emerald-400 animate-ping":"bg-amber-400"}\`}),
              S.jsx("span",{className:"font-bold",style:{color:"#ffffff"},children:n?"स्वचालित मोड सक्रिय (RUNNING)":"सिस्टम रुका हुआ है"})
            ]})
          ]})
        ]}),

        // 2-COLUMN MAIN INTERFACE: ALWAYS SIDE-BY-SIDE (NO VERTICAL STACKING)
        // LEFT COLUMN: SETTING / CONTROLS / CLOCK (370px) - User Explicit Requirement
        // RIGHT COLUMN: TIME TABLE (1fr) - User Explicit Requirement
        S.jsxs("div",{style:{display:"grid",gridTemplateColumns:"370px 1fr",gap:"16px",padding:"16px",background:"#f8fafc",alignItems:"start"},children:[

          // ==========================================
          // LEFT COLUMN: CLOCK, STATUS, CONTROLS & SETTINGS (370px)
          // ==========================================
          S.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",minWidth:"350px"},children:[

            // 1. Clock & Date Card
            S.jsxs("div",{className:"p-3.5 text-center rounded-xl shadow-md relative overflow-hidden",style:{background:"linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)"},children:[
              S.jsxs("div",{className:"flex items-center justify-center gap-1.5 mb-0.5",children:[
                S.jsx("span",{className:"w-2 h-2 rounded-full animate-ping",style:{background:"#34d399"}}),
                S.jsx("p",{className:"text-[11px] uppercase tracking-wider font-bold",style:{color:"#bae6fd"},children:"वर्तमान समय"})
              ]}),
              S.jsx("p",{className:"text-3xl md:text-4xl font-extrabold font-mono tracking-wider drop-shadow-sm",style:{color:"#fef08a"},children:s||N(new Date)}),
              S.jsxs("div",{className:"mt-1.5 pt-1.5 flex items-center justify-between text-xs",style:{borderTop:"1px solid rgba(56, 189, 248, 0.35)",color:"#f0f9ff"},children:[
                S.jsx("span",{className:"font-medium",style:{color:"#ffffff"},children:Q(a)}),
                S.jsx("span",{className:"font-bold px-2.5 py-0.5 rounded-full text-[11px]",style:{background:"#082f49",color:"#fde047",border:"1px solid rgba(254, 240, 138, 0.4)"},children:_C(a)})
              ]}),
              // Next Bell Live Countdown
              nextBellInfo?S.jsxs("div",{className:"mt-2.5 p-2 rounded-lg text-xs flex items-center justify-between shadow-inner",style:{background:"#082f49",border:"1px solid rgba(56, 189, 248, 0.4)",color:"#f0f9ff"},children:[
                S.jsxs("span",{className:"font-bold flex items-center gap-1 text-[11px]",style:{color:"#e0f2fe"},children:[
                  S.jsx(Ki,{className:"w-3.5 h-3.5 text-amber-300 animate-bounce"}),
                  \`अगली: \${nextBellInfo.item.label} (\${nextBellInfo.time12})\`
                ]}),
                S.jsx("span",{className:"font-extrabold px-2 py-0.5 rounded text-[10px] shadow",style:{background:"#facc15",color:"#0f172a"},children:\`\${nextBellInfo.remMin}m \${nextBellInfo.remSec}s शेष\`})
              ]}):S.jsx("div",{className:"mt-2 p-1.5 rounded text-[11px] font-medium",style:{background:"rgba(8, 47, 73, 0.5)",color:"#bae6fd"},children:"आज के सभी पीरियड संपन्न। कल प्रातः पुनः शुरू होगी।"})
            ]}),

            // 2. Status Bar (Clear White Card with Bold Dark Text)
            S.jsxs("div",{className:"p-2.5 rounded-xl shadow-sm flex items-center justify-between text-xs",style:{background:"#ffffff",border:"1px solid #bae6fd"},children:[
              S.jsxs("div",{className:"flex items-center gap-2",children:[
                S.jsx(Ki,{className:\`w-4 h-4 \${c?"text-amber-500 animate-bounce":"text-emerald-600"}\`}),
                S.jsx("span",{className:"font-bold",style:{color:"#0f172a"},children:x})
              ]}),
              c&&S.jsx("button",{onClick:stopAllAudio,className:"bell-btn-stop text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer",style:{background:"#dc2626",color:"#ffffff"},children:"⏹️ बंद करें"})
            ]}),

            // 3. Season Selection Buttons (सत्र समय-सारणी)
            S.jsxs("div",{className:"p-2.5 rounded-xl shadow-sm flex flex-col gap-1.5",style:{background:"#ffffff",border:"1px solid #bae6fd"},children:[
              S.jsxs("div",{className:"flex items-center justify-between",children:[
                S.jsx("span",{className:"text-xs font-bold",style:{color:"#0f172a"},children:"सत्र समय-सारणी:"}),
                S.jsx("span",{className:"text-[10px] font-bold px-2 py-0.5 rounded",style:{background:"#e0f2fe",color:"#0369a1",border:"1px solid #7dd3fc"},children:e==="winter"?"शीतकालीन (09:45 AM)":"ग्रीष्मकालीन (07:15 AM)"})
              ]}),
              S.jsxs("div",{className:"flex gap-2",children:[
                S.jsxs("button",{onClick:()=>t("summer"),className:"flex-1 py-1.5 px-2 rounded-lg font-bold text-xs cursor-pointer transition-all",style:{background:e==="summer"?"linear-gradient(135deg, #ea580c 0%, #c2410c 100%)":"#f1f5f9",color:e==="summer"?"#ffffff":"#1e293b",border:e==="summer"?"2px solid #fed7aa":"1px solid #cbd5e1"},children:[
                  "☀️ ग्रीष्मकालीन (07:15 AM)"
                ]}),
                S.jsxs("button",{onClick:()=>t("winter"),className:"flex-1 py-1.5 px-2 rounded-lg font-bold text-xs cursor-pointer transition-all",style:{background:e==="winter"?"linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)":"#f1f5f9",color:e==="winter"?"#ffffff":"#1e293b",border:e==="winter"?"2px solid #bfdbfe":"1px solid #cbd5e1"},children:[
                  "❄️ शीतकालीन (09:45 AM)"
                ]})
              ]})
            ]}),

            // 4. Master Save Button (Compact, Solid Forest Green, Professional Width)
            S.jsxs("button",{
              onClick:handleMasterSave,
              className:"w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform transform active:scale-95 shadow",
              style:{background:"linear-gradient(135deg, #15803d 0%, #16a34a 100%)",color:"#ffffff",border:"2px solid #86efac"},
              title:"सभी सेटिंग्स और समय-सारणी को कंप्यूटर में स्थायी रूप से सेव करें",
              children:[
                S.jsx(_w,{className:"w-4 h-4 text-white"}),
                "💾 मास्टर सेटिंग्स सेव करें (Save & Lock)"
              ]
            }),
            saveMsg&&S.jsx("div",{className:"p-2 rounded-lg text-[11px] font-bold text-center",style:{background:"#dcfce7",border:"1px solid #22c55e",color:"#15803d"},children:saveMsg}),

            // 5. System Controls (Running / Stop)
            S.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[
              S.jsxs("button",{onClick:n?Er:jt,className:"py-2 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",style:{background:n?"linear-gradient(135deg, #059669 0%, #10b981 100%)":"linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",color:"#ffffff",border:n?"1px solid #6ee7b7":"1px solid #fde68a"},children:[
                S.jsx(jw,{className:"w-3.5 h-3.5 text-white"}),
                S.jsx("span",{children:n?"🟢 RUNNING":"▶️ शुरू करें"})
              ]}),
              S.jsxs("button",{onClick:Er,className:"py-2 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",style:{background:"linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",color:"#ffffff",border:"1px solid #fca5a5"},children:[
                S.jsx(Dw,{className:"w-3.5 h-3.5 text-white"}),
                S.jsx("span",{children:"⏹️ रोकें (STOP)"})
              ]})
            ]}),

            // 6. Manual Bell Buttons (10s Clean Long Bell & 1s Period Bell)
            S.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[
              S.jsxs("button",{onClick:ee,className:\`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm \${w?"animate-pulse":""}\`,style:{background:"linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",color:"#ffffff",border:"1px solid #93c5fd"},children:[
                S.jsx(Ki,{className:"w-3.5 h-3.5 text-amber-300"}),
                S.jsx("span",{children:w?"⏹️ बंद करें":"📢 लंबी घंटी (10s)"})
              ]}),
              S.jsxs("button",{onClick:fn,className:"py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm",style:{background:"linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",color:"#ffffff",border:"1px solid #fdba74"},children:[
                S.jsx(Ki,{className:"w-3.5 h-3.5 text-white"}),
                S.jsx("span",{children:"🔔 पीरियड घंटी (1s)"})
              ]})
            ]}),

            // 7. Master Volume Controls
            S.jsxs("div",{className:"p-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm",style:{background:"#ffffff",border:"1px solid #bae6fd"},children:[
              S.jsxs("div",{className:"flex items-center gap-1 font-bold",style:{color:"#0f172a"},children:[
                "🔊 वॉल्यूम:",
                S.jsx("span",{className:"font-extrabold text-[11px]",style:{color:"#0284c7"},children:\`\${Math.round(vol*100)}%\`})
              ]}),
              S.jsxs("div",{className:"flex items-center gap-1",children:[
                S.jsx("button",{onClick:()=>setVol(1.0),className:"px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer",style:{background:vol===1.0?"#0284c7":"#f1f5f9",color:vol===1.0?"#ffffff":"#1e293b",border:"1px solid #cbd5e1"},children:"100%"}),
                S.jsx("button",{onClick:()=>setVol(0.75),className:"px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer",style:{background:vol===0.75?"#0284c7":"#f1f5f9",color:vol===0.75?"#ffffff":"#1e293b",border:"1px solid #cbd5e1"},children:"75%"}),
                S.jsx("button",{onClick:()=>setVol(0.5),className:"px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer",style:{background:vol===0.5?"#0284c7":"#f1f5f9",color:vol===0.5?"#ffffff":"#1e293b",border:"1px solid #cbd5e1"},children:"50%"})
              ]})
            ]}),

            // 8. Auto-Start Status Badge
            S.jsxs("div",{className:"p-2 rounded-xl flex items-center justify-between text-xs",style:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#065f46"},children:[
              S.jsxs("div",{className:"flex items-center gap-1.5 text-[11px]",children:[
                S.jsx("span",{className:"w-2 h-2 rounded-full",style:{background:"#059669"}}),
                S.jsx("span",{children:"विंडोज बूट होते ही स्वतः चालू | बैकग्राउंड रनिंग"})
              ]}),
              S.jsx("span",{className:"font-extrabold px-1.5 py-0.2 rounded text-[10px]",style:{background:"#059669",color:"#ffffff"},children:"✓ ON"})
            ]})
          ]}),

          // ==========================================
          // RIGHT COLUMN: TIME TABLE SCHEDULE (1fr)
          // ==========================================
          S.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"10px",minWidth:0},children:[

            // Table Header Bar with Reset
            S.jsxs("div",{className:"flex items-center justify-between px-1",children:[
              S.jsxs("h2",{className:"text-sm md:text-base font-bold font-hindi-serif flex items-center gap-1.5",style:{color:"#0f172a"},children:[
                S.jsx("span",{className:"w-2 h-2 rounded-full",style:{background:"#0284c7"}}),
                e==="summer"?"ग्रीष्मकालीन समय-सारणी (07:15 AM - 01:00 PM)":"शीतकालीन समय-सारणी (09:45 AM - 04:00 PM)"
              ]}),
              S.jsxs("button",{onClick:pn,className:"flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-full font-bold cursor-pointer transition-all shadow-sm",style:{background:"#e0f2fe",color:"#0369a1",border:"1px solid #7dd3fc"},title:"डिफ़ॉल्ट सरकारी समय पर रीसेट करें",children:[
                S.jsx(Lw,{className:"w-3 h-3"}),
                "डिफ़ॉल्ट रीसेट"
              ]})
            ]}),

            // Timetable Container (High contrast, crystal clear text and rows)
            S.jsx("div",{className:"bell-table-container",style:{background:"#ffffff",border:"2px solid #bae6fd",borderRadius:"14px",overflowX:"auto",boxShadow:"0 8px 20px -4px rgba(2, 132, 199, 0.15)"},children:
              S.jsxs("table",{className:"w-full border-collapse",children:[
                S.jsx("thead",{children:
                  S.jsxs("tr",{className:"bell-table-header",style:{background:"linear-gradient(90deg, #075985 0%, #0369a1 100%)",color:"#ffffff"},children:[
                    S.jsx("th",{className:"text-left w-20 pl-2.5 py-2 text-xs font-bold",style:{color:"#ffffff"},children:"समय"}),
                    S.jsx("th",{className:"text-left py-2 text-xs font-bold",style:{color:"#ffffff"},children:"पीरियड / विवरण"}),
                    S.jsx("th",{className:"text-center w-32 py-2 text-xs font-bold",style:{color:"#ffffff"},children:"घंटी प्रकार"}),
                    S.jsx("th",{className:"text-center w-20 py-2 text-xs font-bold",style:{color:"#ffffff"},children:"🔔 टेस्ट"}),
                    S.jsx("th",{className:"text-center w-14 pr-2 py-2 text-xs font-bold",style:{color:"#ffffff"},children:"बदलें"})
                  ]})
                }),
                S.jsx("tbody",{children:B.map((W,V)=>{
                  const cnt=getStrikeCount(W);
                  const isCurrent=h===V&&!p;
                  const isTesting=activeTestRow===V;
                  const isHighlight=p===W.label;

                  // High-Contrast Row Styling
                  const rowBg=isTesting?"#ffedd5":isHighlight||isCurrent?"#fef3c7":V%2===0?"#ffffff":"#f8fafc";
                  const rowBorderLeft=isTesting?"4px solid #ea580c":isHighlight||isCurrent?"4px solid #f59e0b":"none";

                  // Display accurate description according to Rajasthan Shivira rules:
                  const isFirstWarn=W.label&&W.label.includes("प्रथम सूचना");
                  const isSecondWarn=W.label&&W.label.includes("द्वितीय सूचना");
                  const bellDesc=isFirstWarn?"10s लंबी + 1 टन":isSecondWarn?"10s लंबी + 2 टन":cnt===0?"10s लंबी घंटी":cnt===-1?"10s विश्राम":\`\${cnt} बार Tan\`;

                  return S.jsxs("tr",{style:{background:rowBg,borderLeft:rowBorderLeft,borderBottom:"1px solid #e2e8f0"},className:"transition-all",children:[
                    // Time Cell
                    S.jsx("td",{className:"py-2 pl-2.5 text-xs font-bold",style:{color:"#0369a1",fontFamily:"'Consolas', 'Courier New', monospace"},children:R===V?
                      S.jsx("input",{type:"time",value:_,onChange:oe=>z(oe.target.value),className:"border-2 border-sky-500 rounded px-1 py-0.5 text-xs w-20 font-mono font-bold bg-white text-slate-800",autoFocus:!0}):
                      I(W.time)
                    }),
                    // Label Cell
                    S.jsxs("td",{className:"py-2 px-2 text-xs font-bold",style:{color:"#0f172a"},children:[
                      W.label,
                      isCurrent&&S.jsx("span",{className:"ml-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow",style:{background:"#0369a1",color:"#ffffff"},children:"वर्तमान"})
                    ]}),
                    // Strike Description Cell
                    S.jsx("td",{className:"py-2 px-1 text-center text-[11px] font-bold whitespace-nowrap",style:{color:"#334155"},children:bellDesc}),
                    // Test Button Cell
                    S.jsx("td",{className:"py-1.5 px-1 text-center",children:
                      S.jsxs("button",{
                        onClick:()=>de(cnt,W.label,V),
                        className:"bell-btn-test",
                        style:{background:isTesting?"#dc2626":"linear-gradient(135deg, #d97706 0%, #b45309 100%)",color:"#ffffff",border:"1px solid #78350f",fontWeight:"800",padding:"4px 10px",borderRadius:"6px",fontSize:"11px"},
                        title:\`\${W.label} टेस्ट करें (\${bellDesc})\`,
                        children:[
                          S.jsx(Ki,{className:"w-3 h-3",style:{color:"#fde68a"}}),
                          "टेस्ट"
                        ]
                      })
                    }),
                    // Edit / Save Button Cell
                    S.jsx("td",{className:"py-1.5 pr-2 text-center",children:R===V?
                      S.jsxs("div",{className:"flex items-center justify-center gap-1",children:[
                        S.jsx("button",{onClick:()=>Kt(V),className:"p-1 rounded cursor-pointer shadow",style:{background:"#16a34a",color:"#ffffff"},title:"सेव करें",children:
                          S.jsx(_w,{className:"w-3 h-3"})
                        }),
                        S.jsx("button",{onClick:Mt,className:"p-1 rounded cursor-pointer shadow",style:{background:"#dc2626",color:"#ffffff"},title:"रद्द करें",children:
                          S.jsx(Dm,{className:"w-3 h-3"})
                        })
                      ]}):
                      S.jsx("button",{onClick:()=>_t(V),className:"p-1 rounded cursor-pointer transition-all",style:{color:"#0284c7"},title:"समय बदलें",children:
                        S.jsx(Mw,{className:"w-3.5 h-3.5"})
                      })
                    })
                  ]},\`\${W.label}-\${V}\`);
                })})
              ]})
            }),

            // Instruction Note (Compact)
            S.jsxs("div",{className:"p-2 rounded-xl text-center text-[11px]",style:{background:"#f0f9ff",border:"1px solid #bae6fd",color:"#0369a1"},children:[
              S.jsx("p",{className:"font-bold",style:{color:"#075985"},children:"💡 निर्देश: समय बदलने के बाद बाईं ओर 'मास्टर सेटिंग्स सेव करें' बटन अवश्य दबाएं।"}),
              S.jsx("p",{className:"text-[10px] mt-0.5",style:{color:"#0284c7"},children:"कंप्यूटर रीस्टार्ट होने पर भी आपकी सेटिंग्स 100% सुरक्षित रहेंगी।"})
            ]})
          ]})
        ]}),

        // Footer Banner
        S.jsxs("div",{className:"p-2.5 text-center",style:{background:"linear-gradient(90deg, #0c4a6e 0%, #075985 50%, #0c4a6e 100%)",borderTop:"1px solid #38bdf8"},children:[
          S.jsxs("div",{className:"flex items-center justify-center gap-2 mb-0.5",children:[
            S.jsx(ef,{className:"w-3 h-3 text-amber-300 animate-pulse"}),
            S.jsx("span",{className:"font-bold text-[11px] tracking-wide",style:{color:"#fef08a"},children:"ज्ञानं परमं ध्येयम् | Digital Bell Pro (शिविरा पंचांग राजस्थान)"}),
            S.jsx(ef,{className:"w-3 h-3 text-amber-300 animate-pulse"})
          ]}),
          S.jsx("p",{className:"text-[10px]",style:{color:"#e0f2fe"},children:"सॉफ्टवेयर डिज़ाइनर: नगजी यादव साकोदरा (चीखली, डूंगरपुर) | मोबाइल: 9982151938"})
        ]})
      ]})
    })
  ]});
},`;

const finalBundle = pristineBundle.substring(0, startIdx) + newMCCode + pristineBundle.substring(endIdx);

fs.writeFileSync(BUNDLE_PATH_1, finalBundle, 'utf-8');
console.log('✓ Successfully written to', BUNDLE_PATH_1);

fs.writeFileSync(BUNDLE_PATH_2, finalBundle, 'utf-8');
console.log('✓ Successfully written to', BUNDLE_PATH_2);

console.log('✓ Frontend build completed successfully!');
