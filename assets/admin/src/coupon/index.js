import * as React from 'react';
import {render} from 'react-dom';
import { TabPanel } from '@wordpress/components';
import './style.css';
import Counter from "./Counter";

const onSelect = ( tabName ) => {
    console.log( 'Selecting tab', tabName );
};
const MyTabPanel = () => (
    <TabPanel
        className="my-tab-panel"
        activeClass="active-tab"
        onSelect={ onSelect }
        orientation="vertical"
        tabs={ [
            {
                name: 'tab1',
                title: 'Tab WOW',
                className: 'tab-one',
            },
            {
                name: 'tab2',
                title: 'Tab 2',
                className: 'tab-two',
            },
        ] }
    >
        { ( tab ) => <p>{ tab.title }</p> }
    </TabPanel>
);

window.addEventListener("load", function () {
    render(
        <MyTabPanel/>,
        document.getElementById("yatra-coupon-meta-element")
    );

});