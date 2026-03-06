import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { validateEnv } from './api/config'
import './index.css'
import App from './App.jsx'

// #region agent log
fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'main.jsx:entry',message:'main.jsx started',data:{rootExists:!!document.getElementById('root')},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
// #endregion
validateEnv()
// #region agent log
fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'main.jsx:afterValidateEnv',message:'validateEnv done',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
// #endregion

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// #region agent log
fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'main.jsx:afterRender',message:'createRoot.render called',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
// #endregion
