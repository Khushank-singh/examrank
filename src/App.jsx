import { useState } from "react";
import { motion } from "framer-motion";
import History from "./History";
import Auth from "./Auth";
import RankChart from "./RankChart";

export default function App(){

  const token = localStorage.getItem("token");

  const [stream,setStream]=useState("PCM");
  const [physics,setPhysics]=useState("");
  const [chemistry,setChemistry]=useState("");
  const [maths,setMaths]=useState("");
  const [biology,setBiology]=useState("");

  const [rank,setRank]=useState(null);
  const [percentile,setPercentile]=useState(null);
  const [confidence,setConfidence]=useState(null);
  const [totalMarks,setTotalMarks]=useState(null);


  function logout(){

    localStorage.removeItem("token");
    window.location.reload();

  }


  async function predictRank(){

    const payload={

      physics:Number(physics)||0,
      chemistry:Number(chemistry)||0,
      maths:stream==="PCM"?Number(maths)||0:0,
      biology:stream==="PCB"?Number(biology)||0:0,
      stream

    };

    const res=await fetch("https://examrank-backend.onrender.com/predict",{

      method:"POST",

      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
      },

      body:JSON.stringify(payload)

    });

    const data=await res.json();

    setRank(data.predicted_rank);
    setPercentile(data.percentile);
    setConfidence(data.confidence);
    setTotalMarks(data.total_marks);

  }


  if(!token) return <Auth/>;


  return(

    <motion.div

      initial={{opacity:0}}
      animate={{opacity:1}}
      transition={{duration:0.6}}

      className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900"
    >

      {/* Navbar */}

      <div className="backdrop-blur-lg bg-white/5 border-b border-white/10">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">

            ExamRank Dashboard

          </h1>

          <motion.button

            whileHover={{scale:1.1}}
            whileTap={{scale:0.9}}

            onClick={logout}

            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm sm:text-base"

          >

            Logout

          </motion.button>

        </div>

      </div>


      {/* Main Layout */}

      <div className="max-w-7xl mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">


        {/* Prediction Card */}

        <motion.div

          initial={{x:-50,opacity:0}}
          animate={{x:0,opacity:1}}

          className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 shadow-xl"
        >

          <h2 className="text-base sm:text-lg md:text-xl text-cyan-400 mb-4">

            Enter Your Marks

          </h2>


          <select

            className="w-full mb-3 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm sm:text-base"

            value={stream}

            onChange={e=>setStream(e.target.value)}

          >

            <option value="PCM">JEE (PCM)</option>

            <option value="PCB">NEET (PCB)</option>

          </select>


          <input

            placeholder="Physics"

            className="w-full mb-3 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg"

            value={physics}

            onChange={e=>setPhysics(e.target.value)}

          />


          <input

            placeholder="Chemistry"

            className="w-full mb-3 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg"

            value={chemistry}

            onChange={e=>setChemistry(e.target.value)}

          />


          {stream==="PCM" &&

            <input

              placeholder="Maths"

              className="w-full mb-3 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg"

              value={maths}

              onChange={e=>setMaths(e.target.value)}

            />

          }


          {stream==="PCB" &&

            <input

              placeholder="Biology"

              className="w-full mb-3 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg"

              value={biology}

              onChange={e=>setBiology(e.target.value)}

            />

          }


          <motion.button

            whileHover={{scale:1.05}}
            whileTap={{scale:0.95}}

            onClick={predictRank}

            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base"

          >

            Predict Rank

          </motion.button>


          {/* Result */}

          {rank &&

            <motion.div

              initial={{opacity:0,y:20}}
              animate={{opacity:1,y:0}}

              className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-sm sm:text-base"
            >

              <p>Total Marks: {totalMarks}</p>

              <p>Rank: {rank}</p>

              <p>Percentile: {percentile}%</p>

              <p>Confidence: {confidence}%</p>

            </motion.div>

          }


          {/* Chart */}

          {rank &&

            <div className="mt-4">

              <RankChart

                marks={totalMarks}

                rank={rank}

              />

            </div>

          }

        </motion.div>


        {/* History */}

        <motion.div

          initial={{x:50,opacity:0}}
          animate={{x:0,opacity:1}}

          className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 shadow-xl"
        >

          <h2 className="text-base sm:text-lg md:text-xl text-cyan-400 mb-4">

            History

          </h2>

          <div className="h-[300px] sm:h-[400px] lg:h-[500px] overflow-y-auto">

            <History/>

          </div>

        </motion.div>


      </div>

    </motion.div>

  );

}
