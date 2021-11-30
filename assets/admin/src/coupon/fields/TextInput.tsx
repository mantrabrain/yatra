import * as React from 'react';
import Tooltip from "../components/tooltip";
import {PanelRow} from '@wordpress/components';

type TextProps = {
    settings: Setting
}

type Setting = {
    title: string,
    desc: string,
    desc_tip: boolean,
    name: string,
    type: string,
    value: string,
    placeholder: string
}
export default class TextInput extends React.Component<TextProps> {
    render() {
        const {settings} = this.props;
        return (

            <div className="yatra-field-wrap"><label
                htmlFor={settings.name}>{settings.title}</label>
                <input className="yatra-input" id={settings.name}
                       name={settings.name} type="text" defaultValue={settings.value}
                       placeholder={settings.placeholder}/>
                {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
            </div>
        );
    }
}