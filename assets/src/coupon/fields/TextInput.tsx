import * as React from 'react';
import {ChangeEvent} from 'react';
import Tooltip from "../components/tooltip";
import NumberInput from "./NumberInput";
import Select from "./Select";
import DateTime from "./dateTime";

type TextProps = {
    settings: Setting,
    fieldChange: (name: string, value: any) => {},
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
        const {settings, fieldChange} = this.props;

        const handleInputChange = (event: ChangeEvent<{ value: string }>) => {
            let value = event?.currentTarget?.value;
            // @ts-ignore
            let name = event?.currentTarget?.name;
            fieldChange(name, value)

        }
        return (

            <div className="yatra-field-wrap"><label
                htmlFor={settings.name}>{settings.title}</label>
                <input className="yatra-input" id={settings.name}
                       name={settings.name} type="text" defaultValue={settings.value}
                       placeholder={settings.placeholder} onChange={handleInputChange}/>
                {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
            </div>
        );
    }
}