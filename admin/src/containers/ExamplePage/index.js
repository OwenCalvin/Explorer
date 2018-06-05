import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { injectIntl } from 'react-intl';
import { bindActionCreators, compose } from 'redux';
import SortableTree from 'react-sortable-tree';
import FileExplorerTheme from 'react-sortable-tree-theme-file-explorer';

import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';

import Button from 'components/Button';
import InputText from 'components/InputText';

import styles from './styles.scss';
import { loadData, setTreeData, persist, setSelected } from './actions';
import { makeSelectLoading, makeSelectData, makeSelectTreeData, makeSelectSelected } from './selectors';
import reducer from './reducer';
import saga from './saga';

export class ExamplePage extends React.Component {
  selected = null;
  constructor(props) {
    super(props);
    props.loadData();
    this.state = {
      edited: {
        _id: '',
        tmp: false,
        title: 'Nothing is selected',
        fields: []
      },
      prop: ''
    };
  }
  handleInputChange = prop => event => {
    const value = event.target.value;
    this.setState({
      edited: {
        ...this.state.edited,
        fields: {
          ...this.state.edited.fields,
          [prop]: value
        }
      }
    });
  }
  handleInputChangeProp = prop => event => {
    const newProp = event.target.value;
    const newObj = {};
    for (const [key, value] of Object.entries(this.state.edited.fields)) {
      if (key !== prop) {
        newObj[key] = value;
      } else {
        newObj[newProp] = value;
      }
    }
    this.state.edited.tmp.fields = newObj;
    this.state.edited.fields = newObj;
    this.forceUpdate();
  }
  handleInputChangeTitle = event => {
    const value = event.target.value;
    this.setState({
      edited: {
        ...this.state.edited,
        title: value
      }
    });
  }
  tree() {
    return (
      <div style={{ height: 500, margin: '1em .5em 0 1em'}}>
        <SortableTree
        treeData={this.props.treeData}
        onChange={data => this.props.setTreeData(data)}
        theme={FileExplorerTheme}
        className='tree'
        scaffoldBlockPxWidth={20}
        generateNodeProps={rowInfo => ({
          onClick: () => {
            const newObj = {
              _id: rowInfo.node._id,
              title: rowInfo.node.title,
              fields: rowInfo.node.fields,
              tmp: rowInfo.node
            };
            this.props.setSelected(newObj);
            this.setState({edited: newObj});
            this.forceUpdate();
          }
        })}>
        </SortableTree>
      </div>
    );
  }
  fields () {
    if(this.state.edited.selected !== null) {
      const field = [];
      field.push(
        <div>
          <input disabled={!this.state.edited.tmp} className={styles.title} onChange={this.handleInputChangeTitle} value={this.state.edited.title}/>
        </div>
      );
      for (let prop in this.state.edited.fields) {
        field.push(
          <div className={styles.mb_25}>
            <div className="row">
              <div className="col-md-12">
                <input className={styles.prop} value={prop} onChange={this.handleInputChangeProp(prop)}/>
              </div>
            </div>
            <div className="row">
              <div className='col-lg-10 col-md-9'>
                <InputText
                styles={styles}
                key={prop}
                name={prop}
                inputDescription={prop}
                placeholder="Your value..."
                onChange={this.handleInputChange(prop)}
                value={this.state.edited.fields[prop]}></InputText>
              </div>
              <div className="col-md-3 col-lg-2">
                <button
                className={styles.btnDelete}
                onClick={() => {
                  delete this.state.edited.fields[prop];
                  this.forceUpdate();
                }}>-</button>
              </div>
            </div>
          </div>
        );
      }
      return field;
    } else {
      return <div></div>;
    }
  }
  render() {
    const selectedElement = this.fields();
    const renderBtn = this.props.selected ? (
      <div>
        <div className={styles.mb_25}>
          <Button
          primary
          label="+"
          onClick={() => {
            this.state.edited.fields[`New ${Object.keys(this.state.edited.fields).length}`] = '';
            this.fields();
            this.forceUpdate();
            console.log(this.state.edited);
            return;
          }}/>
        </div>
        <div>
          <Button
          primary
          onClick={() => {
            this.state.edited.tmp.title = this.state.edited.title;
            this.state.edited.tmp.fields = this.state.edited.fields;
            this.props.setSelected({
              _id: this.props.selected._id,
              title: this.state.edited.title,
              fields: {
                ...this.props.selected.fields,
                ...this.state.edited.fields
              }
            });
            this.props.persist();
          }}
          label="Apply"/>
        </div>
      </div>
    ) : <div></div>;
    return (
      <div className={styles.examplePage}>
        <div className="row">
          <div className="col-md-12">
            <div className="row">
              <div className="col-md-3">
                {this.tree()}
              </div>
              <div className={styles.card + ' col-md-9'}>
                <div className="row">
                  <div className="col-md-12">
                    {selectedElement}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    {renderBtn}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ExamplePage.contextTypes = {
  router: PropTypes.object,
};

ExamplePage.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  selected: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object
  ]),
  persist: PropTypes.func,
  setTreeData: PropTypes.func,
  loadData: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      loadData,
      setTreeData,
      persist,
      setSelected
    },
    dispatch,
  );
}

const mapStateToProps = createStructuredSelector({
  loading: makeSelectLoading(),
  data: makeSelectData(),
  treeData: makeSelectTreeData(),
  selected: makeSelectSelected()
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'examplePage', reducer });
const withSaga = injectSaga({ key: 'examplePage', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(injectIntl(ExamplePage));
