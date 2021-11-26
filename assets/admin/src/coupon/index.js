import * as React from 'react';
import {render} from 'react-dom';
import {TabPanel} from '@wordpress/components';
import './style.scss';
import Counter from "./Counter";

const onSelect = (tabName) => {
    console.log('Selecting tab', tabName);
};
const tabLists = () => {
    let all_tabs = YatraCouponSettings.tabs;
    let updated_all_tabs = [];
    for (const [key, options] of Object.entries(all_tabs)) {
        let title = typeof options.title !== "undefined" ? options.title : '';
        let content_title = typeof options.content_title !== "undefined" ? options.content_title : '';
        console.log(options);
        if (title !== '') {
            updated_all_tabs.push({
                name: key,
                title: title,
                className: key,
                content_title: content_title
            });
        }
    }
    return updated_all_tabs;
}
const YatraCouponTabPanel = () => (
    <TabPanel
        className="yatra-coupon-tabs"
        activeClass="active-tab"
        onSelect={onSelect}
        orientation="vertical"
        tabs={tabLists()}
    >
        {(tab) => <p>{tab.content_title}</p>}
    </TabPanel>
);

window.addEventListener("load", function () {
    render(
        <YatraCouponTabPanel/>,
        document.getElementById("yatra-coupon-meta-element")
    );

});