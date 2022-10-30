import React, {useEffect, useState, useRef} from "react";
import {render} from 'react-dom';
import {TabPanel} from '@wordpress/components';

import {TabContent} from "./TabContent.js";
import {HiddenInputFields} from "./HiddenInputFields.js";

export const useComponentDidUpdate = (effect, dependencies) => {
    const hasMounted = useRef(false);
    useEffect(
        () => {
            if (!hasMounted.current) {
                hasMounted.current = true;
                return;
            }
            effect();
        },
        dependencies
    );
};

export const CouponTabPanel = (props) => {

    const getAllSettings = (settings) => {

        for (const [key, options] of Object.entries(settings)) {

            let id = typeof options["name"] !== undefined ? options['name'] : '';

            if (id !== '' && props.modifiedSettings[id] !== undefined) {

                settings[key]['value'] = props.modifiedSettings[id];
            }
        }


        return settings;
    }
    const getTabLists = () => {
        let all_tabs = YatraCouponSettings.tabs;
        let updated_all_tabs = [];
        for (const [key, options] of Object.entries(all_tabs)) {
            let title = typeof options.title !== "undefined" ? options.title : '';
            let content_title = typeof options.content_title !== "undefined" ? options.content_title : '';
            let settings = typeof options.settings !== "undefined" ? options.settings : {};
            if (title !== '') {
                if (updated_all_tabs.length === 0) {
                    //  setActiveTab(key);
                }
                updated_all_tabs.push({
                    name: key,
                    title: title,
                    className: key,
                    content_title: content_title,
                    settings: getAllSettings(settings)
                });
            }
        }
        return updated_all_tabs;
    }

    const [activeTab, setActiveTab] = useState(YatraCouponSettings.active_tab);
    const [tabList, setTabLists] = useState(getTabLists());
    const onSelect = (tabName) => {
        setActiveTab(tabName);
    };


    return (
        <>
            <TabPanel
                className="yatra-coupon-tabs"
                activeClass="active-tab"
                onSelect={onSelect}
                orientation="vertical"
                tabs={tabList}
                initialTabName={activeTab}

            >{(tab) => <TabContent tab={tab} active={activeTab} updateSettings={props.setModifiedSettings}/>}
            </TabPanel>

        </>
    )
};
