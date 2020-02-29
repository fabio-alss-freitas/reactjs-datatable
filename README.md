<h1 align="center">
  React Datatable
</h1>

<div align="center">
Datatable converted to React component.
</div>

## Installation
`yarn add reactjs-datatable`
or
`npm install --save reactjs-datatable`

## Usage
```javascript
import DataTable from "reactjs-datatable";

render() {
    return (
     <div className={"box-body"}>
            <DataTable
              tableRef={tableRef}
              id={id}
              idRequired={idRequired}
              fetchUrl={fetchUrl}
              hideAddButton={hideAddButton}
              onAddPress={onAddPress}
              onEditPress={this.handleOnEditPress}
              editableRow={editableRow}
              hideExportButton={hideExportButton}
              onDeletePress={this.handleOnDeletePress}
              serverDisabled={serverDisabled}
              columns={columns}
              hideBoxSearch={hideBoxSearch}
              hidePagingInfo={hidePagingInfo}
            />
          </div>
    );
  }
```



 

  
  tableRef: PropTypes.func,
  


  columns: PropTypes.array,
  columnDefs: PropTypes.object,
 
  

## Props
| Name            | Description                                     | Type    | Required |                        Default Value                        |
| :-------------- | :---------------------------------------------- | :------ | :------: | :---------------------------------------------------------: |
| fetchUrl        | Nome da rota de requisição ao servidor. Esse nome será concatenado com os parâmetros, formando a seguinte url: datatable/**fetchUrl**?start=*0*&length=*50*&order=*nome*&mode=*asc*&search=*Ativo*. Lembrando que as colunas também serão buscadas do servidor através da url: datatable/**fetchUrl**/colunas   | String |         |                                                             |
| idRequired | É necessário enviar um Id junto a url de requisição?              | Boolean  |          | false |
| id       | Id a ser enviado junto a url de requisição, formando a seguinte url: datatable/*fetchUrl*?**id=1**&start=*0*&length=*50*&order=*nome*&mode=*asc*&search=*Ativo* | String |         |                                                             |
| hideAddButton       | Esconder botão de Adicionar Novo Registro?                | Boolean  |          |                            false                           |
| onAddPress      | Função a ser acionada ao clicar no botão Adicionar Novo Registro.                   | Function  |          |                                                          |
| onEditPress        | Função a ser executada ao ser pressionado um botão de editar em uma coluna de ação. Lembrando que deve ser retornado da API, como data da coluna, algo como: <pre><code><button id="edit_1" type="button" class="btn btn-link btn-datatable"...</pre></code>. O id do botao deve ser 'edit_**id**'. Como parâmetro da função, será retornado todos os dados da linha.  | Function    |          |                                                     |
| onDeletePress         | Função a ser executada ao ser pressionado um botão de deletar em uma coluna de ação. Lembrando que deve ser retornado da API, como data da coluna, algo como: <pre><code><button id="delete_1" type="button" class="btn btn-link btn-datatable"...</pre></code>. O id do botao deve ser 'delete_**id**'. Como parâmetro da função, será retornado todos os dados da linha.    | Function |          |                                                    |
| hideExportButton         | Esconder botões de exportar?  | Boolean |          |                            false                             |
| hideBoxSearch         | Esconder caixa de pesquisa?   | Boolean |          |                            false                             |
| hidePagingInfo         | Esconder informação e botões de paginação?  | Boolean |          |                            false                             |
| editableRow         | Ativar opção de travar em uma linha ao ser pressionado o botão de editar.   | Boolean |          |                            false                             |
| serverDisabled         | Desativar serverside e inserir dados manualmente a tabela?   | Boolean |          |                            false                             |
| columns         | Colunas inseridas manualmente. Deve seguir o padrão do [DataTable - Columns](https://datatables.net/reference/option/columns)   | Object |          |                                                         |
| columnDefs         | Definições especiais de colunas. Deve seguir o padrão do [DataTable - ColumnDefs](https://datatables.net/reference/option/columnDefs)  | Object |          |                                                         |
| tableRef         | Referência direta ao datatable, para que possa usar qualquer método do mesmo, ou fazer o CRUD manual a tabela.   | Object |          |                                                         |

## Exemplo de inserção manual:
```javascript
...

componentDidMount() {
 this.tableRef.row
    .add({
      cod: selectedOption.value,
      nome: selectedOption.label.split("-")[1].trim(),
      qtde: qtdeSolicitada
    })
    .draw(false)
}

...
render() {
<Table
    tableRef={r => (this.tableRef = r)}
    serverDisabled
    columns={[
      { title: "Código", data: "cod", orderable: false },
      { title: "Nome", data: "nome", orderable: false },
      { title: "Quantidade", data: "qtde", orderable: false },
    ]}
  />
}
...
```
[Clique aqui](https://datatables.net/reference/api/), para mais informações sobre o DataTable.

## Author
Codemize

## License
ISC
