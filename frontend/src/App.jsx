import { useEffect, useState } from "react"
import "./App.css"
import io from "socket.io-client"
import Editor from "@monaco-editor/react"

const socket=io("http://localhost:5000")

const App = () => {
  const [joined,setJoined]=useState(false)//tells whether user joined or not
  const [roomId,setRoomId]=useState("")//store the roomId entered by the user
  const [username,setUsername]=useState("")
  const [language,setLanguage]=useState("javascript")//maintain the state of lanuage selected by user
  const [code,setCode]=useState("// start code here")//store the code written
  const [copySuccess, setCopySuccess]=useState("")//roomId successfully copied or not
  const [users, setUsers]=useState([])//store the users array,users in that room
  const [typing,setTyping]=useState("")

  useEffect(()=>{
    //Server sends updated users list, You store it in state
    socket.on("userJoined",(users)=>{
      setUsers(users);
    })

    //When another user writes code → update your editor
    socket.on("codeUpdate",(newCode)=>{
        setCode(newCode)
    })

    socket.on("userTyping",(user)=>{
        setTyping(`${user}... is Typing`)
        setTimeout(() => {
          setTyping("")
        }, 2000);
    },[])

    socket.on("languageUpdate",(newLanguage)=>{
        setLanguage(newLanguage)
    })
    return ()=>{
      socket.off("userJoined")
      socket.off("codeUpdate")
      socket.off("userTyping")
      socket.off("languageUpdate")
    }
  },[])

  useEffect(()=>{
      const handleBeforeUnload=()=>{
        socket.emit("leaveRoom")
      }
      window.addEventListener("beforeunload",handleBeforeUnload)

      return ()=>{
        window.addEventListener("beforeunload",handleBeforeUnload)
      }
  },[])

  const  joinRoom=()=>{
    if(roomId && username){
        socket.emit("join",{roomId,username})
        setJoined(true)
    }
  }

  const leaveRoom=()=>{
    socket.emit("leaveRoom")
    setJoined(false)
    setUsername("")
    setUsername("")
    setCode("// start code here ")
    setLanguage("javascript")
  }

  const copyRoomId = ()=>{
    navigator.clipboard.writeText(roomId)
    setCopySuccess("Copied!")
    setTimeout(()=>setCopySuccess(""),2000)
  }

  const handleCodeChange = (newCode)=>{
      setCode(newCode)
      socket.emit("codeChange",{roomId,code: newCode})
      socket.emit("typing",{roomId,username})
  }

  const handleLanguageChange = (e)=>{
      const newLanguage=e.target.value
      setLanguage(newLanguage)
      socket.emit("languageChange",{roomId,language:newLanguage})
  }

  if(!joined){
    return( 
      <div className="join-container">
        <div className="join-form">
          <h1 className="pranali">Join code room</h1>
            <input className="input1" type="text" placeholder="Enter Room Id" value={roomId} onChange={(e)=>setRoomId(e.target.value)}></input>
            <input className="input1" type="text" placeholder="Enter your name " value={username} onChange={(e)=>setUsername(e.target.value)}></input>
            <button className="btn1" onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    )
  }
  return (
    <div className="editor-container">
        <div className="sideBar">
            <div className="room-info">
                <h2>Code Room : {roomId}</h2>
                <button onClick={copyRoomId} className="copy-button">Copy Id</button>
                {copySuccess && <span className="copy-success">{copySuccess} </span>}
            </div>
            <h3>Users in room : </h3>
            <ul> 
                {users.map((user,index) => (
                  <li key={index}>{user}</li>
                ))}
            </ul>
            <p className="typing-indicator">{typing}</p>
            <select className="language-selector" value={language} onChange={handleLanguageChange}>
                <option value="javascript">Javascript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
            </select>
            <button className="leave-room" onClick={leaveRoom}>Leave Room</button>
        </div>

        <div className="editor-wrapper">
            <Editor 
            height={"100%"} defaultLanguage={language} language={language} value={code} onChange={handleCodeChange}
            theme="vs-dark" options={{minimap:{enabled:false}, fontSize:14}}/>
        </div>
    </div>
  )
}
export default App
