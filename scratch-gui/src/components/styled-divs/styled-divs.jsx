// styles.js or styles.ts
import styled from 'styled-components';
import PropTypes from 'prop-types';

const GridContainer = styled.div`
  border: 1px solid ${(props) => props.theme.colors.lightGrey};
  border-radius: 7px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 30px auto;
  padding: 10px 20px;
  width: 500px;
  background-color: ${(props) => props.theme.colors.backgroundGrey};

  @media (max-width: 768px) {
    width: 300px;
    padding: 10px 5px;
  }
`

const ColorIndicator = styled.div`
  background-color: ${(props) => props.color};
  border-radius: 7px;
  height: 20px;
  margin-right: 10px;
  width: 20px;

  @media (max-width: 768px) {
    border-radius: 3px;
    height: 10px;
    width: 10px;
  }
`
const GridButton = styled.button`
  background-color: inherit;
  border: none;
  cursor: pointer;
  font-size: 400,
  padding: 0px;
  width: 50px;
  &:focus {
    outline: none;
  }
  &:hover {
    color: "#dddddd"
  }

  @media (max-width: 768px) {
    font-size: 400,
    width: 10px;
  }
`

ColorIndicator.propTypes = {
  color: PropTypes.node, // list of chart data descriptions
};


export {
  ColorIndicator,
  // GridNode,
  // GridNodeName,
  GridContainer,
  GridButton,
}
