import React from 'react';
import {connect} from 'react-redux';
import {values, pick, isNil, difference} from 'lodash'

import Select from 'react-select';

import {
  Columns,
  Column,
  Button,
  Field as FieldContainer,
  Label,
  Control,
  Help,
} from 'design-workshop';

import {nonChangableFields} from '../constants'

import {validateResource} from '../redux/modules/schemaValidation';

import NewResourceForm from './NewResourceForm';
import NewResourceRow from './NewResourceRow';
import ReferenceResourceForm from './ReferenceResourceForm';

class ForeignKeyCorrection extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.hydrateState()
  }

  componentDidUpdate (prevProps) {
   if (this.props.modificationIndex !== prevProps.modificationIndex) {
      const state = this.hydrateState();
      this.setState({
        ...state
      })
   }
  }

  initFixedValues = () => {
    const {modificationItem} = this.props;
    const fieldList = modificationItem.field.split('|');
    return fieldList.reduce((res, field) => {
      return {
        ...res,
        [field]: ''
      }
    }, {});
  }

  hydrateState = () => {
    const {modificationItem} = this.props;

    let fixedValues = this.initFixedValues()
    if (modificationItem.fixedValues) fixedValues = modificationItem.fixedValues

    return {
      fixedValues,
      showNewForm: false,
      newResource: null,
      newReference: null,
      newRefReference: null,
      showSolving: !modificationItem.fixed,
    }
  }

  handleSubmitForm = () => {
    const {fixedValues, newResource, newReference, newRefReference} = this.state;
    // if(!fixedValue || fixedValue.length === 0) return;
    let fixedReferenceTable = []
    if (newResource) {
      fixedReferenceTable.push(newResource);
    }
    if (newReference) {
      fixedReferenceTable.push(newReference);
    }
    if (newRefReference) {
      fixedReferenceTable.push(newRefReference);
    }

    this.props.onSubmitForm({
      fixedValues,
      fixedReferenceTable
    });
  }

  handleClickCreate = () => {
    const fixedValues = this.initFixedValues()
    this.setState({
      fixedValues,
      showSolving: true,
      showNewForm: true,
      newResource: null,
      newReference: null,
      newRefReference: null
    })
  }

  handleResetCreate = () => {
    this.setState({
      showNewForm: true,
      newResource: null,
      newReference: null
    })
  }

  handleAddNewResource = (payload) => {
    // delete referenceFieldResource.path
    // referenceFieldResource.data = referenceTables[resourceName].push(values);
    // this.props.validateResource(referenceFieldResource)
    const {newResource, newReference, newRefReference} = payload;
    const {modificationItem, foreignKeyField} = this.props;

    const fieldList = modificationItem.field.split('|');
    const fixedValues = fieldList.reduce((res, field, index) => {
      return {
        ...res,
        [field]: fieldList.length > 1 ? newResource.data[0][foreignKeyField.reference.fields[index]] : newResource.data[0][foreignKeyField.reference.fields]
      }
    }, {})
    this.setState({
      newResource,
      newReference,
      newRefReference,
      fixedValues,
      showNewForm: false
    })
  }

  handleCancel = () => {
    this.setState({
      showNewForm: false,
      newResource: null,
      newReference: null,
      newRefReference: null
    })
  }

  handleSelectExist = (item) => {
    const {modificationItem} = this.props;
    if (!item) {
      this.setState({
        fixedValues: {
          [modificationItem.field]: ''
        }
      })
    }
    else {
      this.setState({
        fixedValues: {
          [modificationItem.field]: item.value
        },
        newResource: null
      })
    }
  }

  handleShowSolving = () => {
    this.setState({
      showSolving: true,
      newResource: null,
      newReference: null,
      newRefReference: null
    })
  }

  handleHideSolving = () => {
    this.setState({
      showSolving: false,
      showNewForm: false,
      newResource: null,
      newReference: null,
      newRefReference: null
    })
  }

  renderFixed() {
    const {modificationItem, foreignKeyField} = this.props;
    const {field, fixedValues, fixedReferenceTable, unchangable}= modificationItem;
    const fixedValue = values(fixedValues).join('|');
    const printValue = fixedValue.length ? fixedValue: 'none';
    const isNonchangableField = difference(nonChangableFields, field.split('|')).length < nonChangableFields.length

    return (
      <FieldContainer>
        <Label className="has-text-success">{!isNonchangableField ? "Fixed with value": "Keep original value"}</Label>
        <p className="has-text-success">{printValue}</p>
        <Help isColor="success">
          {!isNonchangableField && <li>total {modificationItem.errors.length} rows updated</li>}
          {
            fixedReferenceTable && fixedReferenceTable.map((table)=> {
              return (
                <li>{table.data.length} row(s) added to "{table.resourceName}" table</li>
              )
            })
          }
        </Help>
        <br/>
        <Button isColor="info" isDisabled={unchangable} onClick={this.handleClickCreate}>Change this fix</Button>
      </FieldContainer>
    )
  }

  renderSolving() {
    const {modificationItem, foreignKeyField, referenceTables} = this.props;
    const {field, fixedReferenceTable}= modificationItem;

    const resourceName = foreignKeyField.reference.resource;  
    const referenceField = foreignKeyField.reference.fields;

    const generateValue = (value) => {
      return {
        value,
        label: value
      }
    }
    
    const fixedValueSelected = generateValue(this.state.fixedValues[field])

    const getOptions = () => {
      const table = referenceTables[resourceName];
      return table.map((item) => {
        return {
          value: item[referenceField],
          label: item[referenceField]
        }
      })
    }
    return (
      <div>
        {
          modificationItem.field === 'source' && !this.state.showNewForm && !this.state.newResource &&
          <FieldContainer>
            <Label>Select from exist sources</Label>
            <Select 
              isSearchable={true}
              isClearable={true}
              value={fixedValueSelected}
              onChange={this.handleSelectExist}
              options={getOptions()} />
            {
              this.state.fixedValues[field] &&
                <Help isColor="success">
                  <li>change "{modificationItem.value}" to "{values(this.state.fixedValues).join("|")}"</li>
                  <li>total {modificationItem.errors.length} rows affected</li>
                </Help>
            }
          </FieldContainer>
        }  
        <FieldContainer>
          <Control>
            <Button isColor='info' onClick={this.handleClickCreate}>Create new item</Button>
          </Control>
        </FieldContainer>  
      </div>
    )
    
  }

  render() {
    const {newResource, fixedValues} = this.state;
    const {modificationItem, foreignKeyField, descriptor, referenceTables} = this.props;
    const {value, message, field}= modificationItem;
    const resourceName = foreignKeyField.reference.resource;  
    const referenceFieldResource = descriptor.resources.find((resource) => resource.name === resourceName);
    
    const getLayoutColumns = (field) => {
      switch(field) {
        case 'reporting':
        case 'partner':
        case 'currency|year|reporting':
          return '1/4'
        default:
          return '1/2'
      }
    }
    const validateFixedValues = () => {
      if (field.split('|').length > 0) {
        const invalidValue = values(this.state.fixedValues).filter((fixedValue) => !fixedValue);
        return invalidValue.length > 0;
      } else return !this.state.fixedValues[field];
    }
    const mapFieldValue = (field, value) => {
      return field.split('|').map((f, index) => {
        return  {
          value: value.split('|')[index],
          field: f,
          referenceField: typeof(foreignKeyField.reference.fields) === 'string' ?
            foreignKeyField.reference.fields:foreignKeyField.reference.fields[index]
        }
      })
    }
    const originalValues = mapFieldValue(field, value);

    const layoutColumn = getLayoutColumns(modificationItem.field);

    const isSubmitDisabled = validateFixedValues();

    return (
      <div style={{height: '60vh'}}>
        <form>
          <Columns>
            <Column isSize={layoutColumn}>
              <FieldContainer>
                <Label>Original value of "{field}":</Label>
                {/* <Input value={value} disabled /> */}
                <div className="has-text-danger">{value}</div>
                <Help isColor="danger">{message}</Help>
              </FieldContainer>
              {!this.state.showSolving && modificationItem.fixed && this.renderFixed()}
              {this.state.showSolving && this.renderSolving()}
            </Column>
            { this.state.showNewForm && 
              <Column className='new-resource-form' style={{flex: 'auto'}}>
                <ReferenceResourceForm 
                  originalValues={originalValues}
                  descriptor={descriptor}
                  resourceDescriptor={referenceFieldResource}
                  referenceTables={referenceTables}
                  onCancel={this.handleCancel}
                  onAddNew={this.handleAddNewResource} />
              </Column>
            }
            {
              this.state.newResource && 
              <Column>
                <NewResourceRow resource={this.state.newResource}/>
                <Button onClick={this.handleClickCreate}>Reset</Button>
              </Column>
            }
            {
              this.state.newReference && 
              <Column>
                <NewResourceRow resource={this.state.newReference}/>
              </Column>
            }
            {
              this.state.newRefReference && 
              <Column>
                <NewResourceRow resource={this.state.newRefReference}/>
              </Column>
            }
          </Columns>
          {
            this.state.showSolving &&
            <FieldContainer isGrouped>
              {
                modificationItem.fixed &&
                <Control>
                  <Button isColor="info" onClick={this.handleHideSolving}>Cancel</Button>
                </Control>
              }
              <Control>
                <Button isColor="info" isDisabled={isSubmitDisabled} onClick={this.handleSubmitForm}>Confirm this fix</Button>
              </Control>
            </FieldContainer>
          }

        </form>
      </div>
    )
  }
}
export default connect(null, {
  validateResource
})(ForeignKeyCorrection);