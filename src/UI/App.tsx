import { render, h, Fragment } from 'preact';
import Router from 'preact-router';
import Main from './pages/main';
import Error from './pages/error';
import Editor from './pages/editor';
import Progress from './pages/progress';
import Settings from './pages/settings';
import Tab from './components/tabs';
import { useContext } from 'preact/hooks';

import './App.css';
import Button from './components/button';

function App() {
    const { changeTab } = useContext(Tab.Context);

    return (
        <Fragment>
            <Tab.Provider>
                <Tab.Content name="home">
                    home
                    <Button onClick={() => {
                        let err = changeTab('test');
                        if (err) {
                            console.error(err)
                        }
                    }}>
                        go to test page
                    </Button>
                </Tab.Content>
                <Tab.Content name="test">
                    test
                    <Button onClick={() => {
                        let err = changeTab('home');
                        if (err) {
                            console.error(err)
                        }
                    }}>
                        go to home page
                    </Button>
                </Tab.Content>
                <Tab.Slot/>
            </Tab.Provider>
        </Fragment>
    );
    /*
    
        <Router>
            <Main path="/"/>
            <Error path="/error"/>
            <Editor path="/editor"/>
            <Progress path="/progress"/>
            <Settings path="/settings"/>
        </Router>
    */
}

render(<App />, document.body);
