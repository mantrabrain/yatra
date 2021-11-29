import * as React from 'react';
import Tooltip from "../components/tooltip";

type TextProps = {
    settings: Setting
}

type Setting = {
    title: string,
    description: string,
    desc_tip: boolean,
    id: string,
    type: string,
    value: string,
    placeholder: string
}
export default class TextInput extends React.Component<TextProps> {
    render() {
        const {settings} = this.props;
        return (
            <div className="yatra-field-wrap"><label
                htmlFor={settings.id}>{settings.title}</label>
                <input className="widefat" id={settings.id}
                       name={settings.id} type="text" defaultValue={settings.value}
                       placeholder={settings.placeholder}/>
                <Tooltip/>
            </div>
        );
    }
}