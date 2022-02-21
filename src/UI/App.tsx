import { h, render } from 'preact';
import Router from 'preact-router';
import Main from './pages/main';
import Error from './pages/error';
import Editor from './pages/editor';
import Progress from './pages/progress';
import Settings from './pages/settings';

import './App.css';

function App() {
    return (
        <Router>
            <Main path="/"/>
            <Error path="/error"/>
            <Editor path="/editor"/>
            <Progress path="/progress"/>
            <Settings path="/settings"/>
        </Router>
    );
}

render(<App />, document.body);
