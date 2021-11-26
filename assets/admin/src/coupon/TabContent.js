import {Card, CardBody} from '@wordpress/components';

export const TabContent = (props) => {
    return (
        <Card size="small">
            <CardBody>{props.tab.content_title}</CardBody>
        </Card>

    )
}
