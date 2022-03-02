import { render } from 'preact';
import Router from 'preact-router';
import Main from './pages/main';
import Error from './pages/error';
import Editor from './pages/editor';
import Progress from './pages/progress';
import Settings from './pages/settings';
import { createHashHistory } from 'history';

import './App.css';

function App() {
    
    return (
        // https://github.com/preactjs/preact-router/issues/423
        // the typemismatch is a lie apparently
        // @ts-ignore
        <Router history={createHashHistory()}>
            <Main path="/" />
            <Error path="/error"/>
            <Editor path="/editor"/>
            <Progress path="/progress"/>
            <Settings path="/settings"/>
        </Router>
    );
    
}

render(<App />, document.body);