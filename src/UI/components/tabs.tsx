import { h, Fragment, createContext, ComponentChildren } from 'preact';
import { useState, useEffect, useContext, useCallback } from 'preact/hooks';
import { ComponentProps } from '../types/component';

type Err = Error|null|undefined;

type TabContextT = {
	tab: string,
	registerTab: (name: string, contents: ComponentChildren) => Err,
	changeTab: (name: string) => Err,
	currentTab: ComponentChildren,
};

type TabProps = ComponentProps<HTMLDivElement> & {
	name: string;
};

const TabContext = createContext<TabContextT>({
	tab: '',
	registerTab: (_0, _1) => new Error('not implemented'),
	changeTab: (_) => new Error('not implemented'),
	currentTab: null,
});

function Context({ children }: ComponentProps<HTMLDivElement>) {
	const [tab, setTab] = useState('');
	const [tabs, setTabs] = useState(new Map<string, ComponentChildren>());
	const [currentTab, setCurrentTab] = useState<ComponentChildren>(null);

	const registerTab = (name: string, contents: ComponentChildren): Err => {
		if (tabs.get(name)) {
			return new Error('tab already exists with the name "' + name + '"');
		}

		setTabs(tabs.set(name, contents));
		
		return;
	};
	const changeTab = (name: string): Err => {
        let t = tabs.get(name);
		if (!t) {
			return new Error('unknown tab');
		}
		setTab(name);
		setCurrentTab(tabs.get(name));
		return;
	};

	return (
		<TabContext.Provider value={{
			tab, registerTab, changeTab, currentTab,
		}}>
			{children}
		</TabContext.Provider>
	);
}

function Content({ name, children }: TabProps) {
	const { tab, registerTab, changeTab, currentTab } = useContext(TabContext);

	useEffect(() => {
		console.log(name, children);
		registerTab(name, children);

		if (!currentTab) {
			let err = changeTab(name);
			if (err) {
				console.error(err);
			}
			console.log(tab);
		}
	}, []);

	return <Fragment/>;
}

function Slot() {
	const { tab, currentTab } = useContext(TabContext);

	return (
		<Fragment>
			{currentTab}
		</Fragment>
	);
}

export default {
    Provider: Context,
    Content,
    Slot,
    Context: TabContext,
}