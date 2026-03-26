import { useState } from 'react';
import HookScreen    from './screens/HookScreen.jsx';
import Q1Disruption  from './screens/Q1Disruption.jsx';
import Q2FlightNumber from './screens/Q2FlightNumber.jsx';
import Q3Date        from './screens/Q3Date.jsx';
import Q4Route       from './screens/Q4Route.jsx';
import Q5Delay       from './screens/Q5Delay.jsx';
import Q6Reason      from './screens/Q6Reason.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import { assessClaim } from './lib/eu261.js';

const FLOW = ['hook','q1','q2','q3','q4','q5','q6','results'];

const INITIAL_ANSWERS = {
  disruption:   null,
  flightNumber: '',
  flightDate:   '',
  from:         '',
  to:           '',
  delayLength:  null,
  reason:       null,
};

export default function App() {
  const [screen,  setScreen]  = useState('hook');
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);

  function updateAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function goNext() {
    const idx = FLOW.indexOf(screen);
    if (idx < FLOW.length - 1) setScreen(FLOW[idx + 1]);
  }

  function goBack() {
    const idx = FLOW.indexOf(screen);
    if (idx > 0) setScreen(FLOW[idx - 1]);
  }

  function reset() {
    setAnswers(INITIAL_ANSWERS);
    setScreen('hook');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sharedProps = { answers, updateAnswer, onNext: goNext, onBack: goBack };

  const result = screen === 'results' ? assessClaim(answers) : null;

  const screens = {
    hook:    <HookScreen onStart={goNext} />,
    q1:      <Q1Disruption  {...sharedProps} />,
    q2:      <Q2FlightNumber {...sharedProps} />,
    q3:      <Q3Date        {...sharedProps} />,
    q4:      <Q4Route       {...sharedProps} />,
    q5:      <Q5Delay       {...sharedProps} />,
    q6:      <Q6Reason      {...sharedProps} onSubmit={goNext} />,
    results: <ResultsScreen result={result} answers={answers} onReset={reset} />,
  };

  return screens[screen] ?? null;
}
