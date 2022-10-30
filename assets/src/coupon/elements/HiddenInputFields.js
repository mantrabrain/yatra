import React, {useEffect, useState} from 'react';

export const HiddenInputFields = (props) => {

    const renderField = (name, value) => {

        return (<input type="hidden" value={value} name={name}/>);
    }

    return (
        <>
            {Object.keys(props.modifiedSettings).map(function (key_name, key_index, i) {
                return renderField(key_name, props.modifiedSettings[key_name])
            })}


        </>

    )
}
