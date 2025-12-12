import './index.css';
import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom' 
import Login from './pages/Login'
import Question1 from './pages/Question1'
import PersonalCreate from './pages/PersonalCreate'
import Question2 from './pages/Question2'
import AdminCreate from './pages/AdminCreate'
import SubUserCreate from './pages/SubUserCreate'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import Settings from './pages/Settings'
import ChatBot  from './pages/ChatBot';
import BusinessDash from './pages/BusinessDash'
import SubUserDash from './pages/SubUserDash'
import BusinessSettings from './pages/BusinessSettings'
import SubUserSettings from './pages/SubUserSettings';
import PlotlyBusiness from './pages/PlotlyBusiness';
import PlotlyPersonal from './pages/PlotlyPersonal';
import BusinessGoals from './pages/BusinessGoals';

function App() {
  return (
    <Router>
      <div className='App'>
        <Routes>
          <Route path="/" element={<Navigate to="/Login" replace />} />
          <Route path="/Login" element={<Login />}/>
          <Route path="/Question1" element={<Question1/>}/>
          <Route path="/PersonalCreate" element={<PersonalCreate/>}/>
          <Route path="/AdminCreate" element={<AdminCreate/>}/>
          <Route path="/Question2" element={<Question2/>}/>
          <Route path="/SubUserCreate" element={<SubUserCreate/>}/>
          <Route path="/Dashboard" element={<Dashboard />}/>
          <Route path="/Goals" element={<Goals />}/>
          <Route path="/ChatBot" element={<ChatBot/>}/>
          <Route path="/Settings" element={<Settings />}/>
          <Route path="/BusinessDash" element={<BusinessDash/>}>
            <Route path="plotly" element={<PlotlyBusiness />} /> 
          </Route>
          <Route path="/SubUserDash" element={<SubUserDash/>}/>
          <Route path="/BusinessSettings" element={<BusinessSettings/>}/>
          <Route path="/SubUserSettings" element={<SubUserSettings/>}/>
          <Route path="/PlotlyBusiness" element={<PlotlyBusiness />} />
          <Route path="/BusinessGoals" element={<BusinessGoals />} />


        </Routes>
      </div>
    </Router>
  )
}
export default App;



