import { Container, Table } from 'react-bootstrap';
import { Suggestion } from '../../types/types';

const SuggestionResult = (props: Suggestion) => {
    const assetResults = (props.assets || []).map((asset) => {
        return (
            <tr key={asset.symbol}>
                <td> {asset.symbol} </td>
                <td> {asset.name} </td>
                <td> {asset.num_shares}</td>
                <td> {asset.percentage.toFixed(2)} % </td>
                <td> ${asset.current_value.toFixed(2)} </td>
            </tr>
        );
    });
    return (
        <Container fluid="lg">
            <h5> Strategy: {props.strategy}</h5>
            <Table>
                <thead>
                    <tr>
                        <th> ETF/Stock</th>
                        <th> Name </th>
                        <th> Number of Shares</th>
                        <th> % Invested </th>
                        <th> Current Value </th>
                    </tr>
                </thead>
                <tbody>{assetResults}</tbody>
            </Table>
        </Container>
    );
};

export default SuggestionResult;
