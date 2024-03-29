import React, {useEffect} from 'react';
import {Card, CardBody} from '@wordpress/components';
import NumberInput from "../fields/NumberInput";
import TextInput from "../fields/TextInput";
import Select from "../fields/Select";
import DateTime from "../fields/dateTime";

export const TabContent = (props) => {
    useEffect(() => {
        tippy('.yatra-tippy-tooltip', {
            allowHTML: true,
        });
    });
    const renderSwitch = (setting) => {

        const field_type = setting.type;
        const onFieldValueChange = (name, value) => {
            props.updateSettings(name, value)
        }
        switch (field_type) {
            case "number":
                return <NumberInput settings={setting} fieldChange={onFieldValueChange}/>;
            case "text":
                return <TextInput settings={setting} fieldChange={onFieldValueChange}/>;
            case "select":
                return <Select settings={setting} fieldChange={onFieldValueChange}/>;
            case "datetime":
                return <DateTime settings={setting} fieldChange={onFieldValueChange}/>;
            default:
                return <TextInput settings={setting} fieldChange={onFieldValueChange}/>;

        }
    }

    return (
        <Card size="small">
            <CardBody><h3>{props.tab.content_title}</h3></CardBody>
            {props.tab.settings.map(function (setting, i) {
                return renderSwitch(setting)
            })}
            <input type="hidden" value={YatraCouponSettings.nonce} name="yatra_coupon_post_type_metabox_nonce"/>
            <input type="hidden" value={props.active} name="yatra_coupon_active_tab"/>
        </Card>

    )
}
