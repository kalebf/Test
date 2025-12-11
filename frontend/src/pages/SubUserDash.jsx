import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PlotlyBusiness from './PlotlyBusiness'; 

function SubUserDash() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // 🔹 EMPTY DEFAULT DATA (prevents crashes)
  const projectName = '';

  const budget = {
    used: 0,
    total: 1 // cannot be 0 or you'll get divide by zero!
  };

  const incomeData = [];        // empty graph data
  const expenseData = [];       // empty graph data

  const recentIncome = [];      // empty table list
  const recentExpenses = [];    // empty table list

  const budgetPercentage = (budget.used / budget.total) * 100;

  const cardShadow = {
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#E0E0E0'
    }}>
      
      {/* NAV BAR */}
      <aside 
        className={`flex flex-col items-center text-white h-screen transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        style={{
          backgroundColor: '#174D1F',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Profile Circle */}
        <div className="h-20 flex items-center w-full justify-center px-4 mb-2">
          <div 
            className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold flex-shrink-0 text-lg"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              border: '3px solid #6BB577'
            }}
          >
            U
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full px-2">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/SubUserDash" 
                className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-green-600 hover:bg-opacity-20"
              >
                <div className="transition-transform duration-200">
                  <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                {isExpanded && (
                  <span className="ml-4 text-sm font-medium whitespace-nowrap">
                    Dashboard
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logo */}
        <div className="h-24 flex items-center justify-center w-full px-4">
          <img
            src={isExpanded ? "/ClariFi-Logo.png" : "/ClariFi-Logo-Small.png"}
            alt="Logo"
            className={`object-contain transition-all duration-300 ${
              isExpanded ? 'h-12 w-auto' : 'h-14 w-14'
            }`}
            style={{
              filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))'
            }}
          />
        </div>

        {/* Settings */}
        <div className="w-full px-2 pb-4 border-t border-white border-opacity-20 pt-2">
          <Link 
            to="/SubUserSettings" 
            className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-green-600 hover:bg-opacity-20"
          >
            <svg
              className="h-6 w-6 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              width="24" height="24"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .83.67 1.51 1.51 1H21a2 2 0 1 1 0 4h-.09c-.84 0-1.51.67-1.51 1z"></path>
            </svg>

            {isExpanded && (
              <span className="ml-4 text-sm font-medium whitespace-nowrap">
                Settings
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
        
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#7D5BA6',
            fontFamily: 'Carme, sans-serif'
          }}>
            Dashboard - {projectName}
          </h1>
        </div>

        {/* Budget Section */}
        <div style={{
          borderRadius: '12px',
          border: '4px solid #89CE94',
          backgroundColor: 'white',
          height: '180px',
          overflow: 'hidden',
          ...cardShadow
        }}>
          <div style={{
            backgroundColor: '#7D5BA6',
            color: 'white',
            fontSize: '26px',
            textAlign: 'center',
            padding: '10px 0'
          }}>
            Budget
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '600' }}>Total Budget Usage</span>
              <span style={{ fontSize: '20px' }}>
                ${budget.used.toLocaleString()} / ${budget.total.toLocaleString()}
              </span>
            </div>

            <div style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              height: '32px'
            }}>
              <div
                style={{
                  height: '32px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  width: `${budgetPercentage}%`,
                  backgroundColor: '#7D5BA6'
                }}
              >
                {budgetPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Graph + Tables */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          height: 'calc(100vh - 370px)'
        }}>
          
          {/* Income Card */}
          <div style={{
            borderRadius: '12px',
            border: '4px solid #89CE94',
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              Income
            </div>

            <div style={{ padding: '16px' }}>
              <PlotlyBusiness data={incomeData} color="#89CE94" type="income" />
            </div>

            <div style={{
              borderTop: '1px solid #e5e7eb',
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px 16px 16px'
            }}>
              <h3 style={{
                fontWeight: '600',
                fontSize: '18px',
                marginBottom: '12px',
                paddingTop: '16px'
              }}>Recent Income</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncome.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{item.description}</td>
                      <td style={{ padding: '8px' }}>{item.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#89CE94' }}>
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses Card */}
          <div style={{
            borderRadius: '12px',
            border: '4px solid #89CE94',
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#7D5BA6',
              color: 'white',
              fontSize: '26px',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              Expenses
            </div>

            <div style={{ padding: '16px' }}>
              <PlotlyBusiness data={expenseData} color="#FFA8C3" type="expenses" />
            </div>

            <div style={{
              borderTop: '1px solid #e5e7eb',
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px 16px 16px'
            }}>
              <h3 style={{
                fontWeight: '600',
                fontSize: '18px',
                marginBottom: '12px',
                paddingTop: '16px'
              }}>Recent Expenses</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{item.description}</td>
                      <td style={{ padding: '8px' }}>{item.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#FFA8C3' }}>
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fixed bottom-4 right-4 text-xs text-gray-500">
            App is owned by Team Nova in partner with Commerce Bank
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubUserDash;