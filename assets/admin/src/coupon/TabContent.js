import {Card, CardBody} from '@wordpress/components';
import NumberInput from "./fields/NumberInput";

export const TabContent = (props) => {
    return (
        <Card size="small">
            <CardBody><h3>{props.tab.content_title}</h3></CardBody>
            <NumberInput settings={props.tab.settings}/>
        </Card>

    )
}
