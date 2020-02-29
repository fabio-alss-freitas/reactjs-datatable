import "./bootstrap.min.css"
import "datatables.net-bs/css/dataTables.bootstrap.min.css"
import "datatables.net-buttons-bs"
import "datatables.net-buttons/js/buttons.html5.js"
import "jszip"
import "pdfmake"

import React from "react"

const $ = require("jquery")
$.DataTable = require("datatables.net-bs")

class Datatable extends React.Component {
  constructor(props) {
    super(props)
    this.tableRef = null
    this.table = null
    this.state = {
      data: null
    }
  }

  async componentDidMount() {
    await this.drawTable()
  }

  componentDidUpdate(prevProps) {
    const { id, serverDisabled } = this.props
    if (id != prevProps.id) {
      if (this.table && !serverDisabled) {
        this.table.ajax.reload()
      }
    }
  }

  componentWillUnmount() {
    if (this.table) {
      this.table.destroy(true)
    }
  }

  getTableId = () => {
    if (this.table) {
      return $(this.tableRef).attr("id")
    } else {
      return null
    }
  }

  handleOnCancelFilter(id) {
    const filterSelector = `div.dataTables_filter input[aria-controls="${this.getTableId()}"]`
    const value = $(filterSelector).val()

    let formattedValue = value.replace(id, "").replace(";;", ";")
    if (formattedValue.startsWith(";")) {
      formattedValue = formattedValue.substring(1)
    }

    $(filterSelector)
      .val(formattedValue)
      .trigger("keyup")
  }

  handleOnClick(i) {
    const { onEditPress, editableRow, onDeletePress } = this.props
    const operation = i.split("_")[0]
    const id = parseInt(i.split("_")[1])

    switch (operation) {
      case "edit":
        if (onEditPress && this.table) {
          this.table.rows().every((index, element) => {
            const row = this.table.rows().data()[index]
            if (row.key == id) {
              if (editableRow) {
                $(`#${this.getTableId()} tr th:last-child`).hide()
                $(`#${this.getTableId()} tr td:last-child`).hide()
                $(`#${this.getTableId()} tr`)
                  .eq(index + 1)
                  .addClass("selected")
              }

              const unhideColumns = newData => {
                $(`#${this.getTableId()} tr th:last-child`).show()
                $(`#${this.getTableId()} tr td:last-child`).show()
                $(`#${this.getTableId()} tr`)
                  .eq(index + 1)
                  .removeClass("selected")
              }

              onEditPress(row, unhideColumns)
            }
          })
        }

        break

      case "delete":
        if (onDeletePress && this.table) {
          this.table.rows().every((index, element) => {
            const row = this.table.rows().data()[index]
            if (row.key == id) {
              onDeletePress(row)
            }
          })
        }
        break
    }
  }

  ajax = async (data, callback) => {
    const { fetchUrl, id, idRequired, serverDisabled } = this.props

    if (serverDisabled) {
      return null
    }

    let formattedSearch = ""

    if (data.search && data.search.value && data.search.value.includes(";")) {
      let filters = data.search.value.trim().split(";")
      if (filters.length > 0 && filters[filters.length - 1] == "") {
        filters.pop()
      }

      $(`.filtered-items[aria-controls="${this.getTableId()}"]`).html(
        filters.map(item => {
          formattedSearch += `${item.trim()};`
          return `<button name="${item.trim()}" type="button" class="btn btn-sm btn-link filtered-separator">${item.trim()} <i name="${item.trim()}" class="fa fa-close icon-click"></i></button>`
        })
      )

      $(`.filtered-items[aria-controls="${this.getTableId()}"]`).on(
        "click",
        event => {
          this.handleOnCancelFilter(event.target.name)
        }
      )
    } else {
      $(`.filtered-items[aria-controls="${this.getTableId()}"]`).empty()
    }

    if (idRequired && !id) {
      callback({
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
      })
    } else {
      $.get(
        `datatable/${fetchUrl}?${id ? `id=${id}&` : ""}start=${
          data.start
        }&length=${data.length}&order=${
          data.columns[data.order[0].column].data
        }&mode=${data.order[0].dir}&search=${formattedSearch ||
          data.search.value}`,
        res => {
          if (res.dataset) {
            const data = res.dataset.data.map(item => {
              if (item.acao != null) {
                return {
                  ...item,
                  acao: item.acao
                    .split('type="button"')
                    .join(`type="button" aria-controls="${this.getTableId()}"`)
                }
              } else {
                return item
              }
            })

            callback({
              ...res.dataset,
              data
            })

            this.setState({ data })
          }
        }
      )
    }
  }

  drawTable = async () => {
    const {
      tableRef,
      fetchUrl,
      onAddPress,
      serverDisabled,
      columns,
      columnDefs
    } = this.props

    if (serverDisabled) {
      this.table = $(this.tableRef).DataTable({
        dom: this.renderDom(),
        buttons: this.renderButtons(),
        columnDefs,
        paging: false,
        columns,
        language: {
          url:
            "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Portuguese-Brasil.json"
        }
      })
    } else {
      const columnsFetch = await fetch(`datatable/${fetchUrl}/colunas`)
      const columnsFetched = await columnsFetch.json()
      this.table = $(this.tableRef).DataTable({
        dom: this.renderDom(),
        buttons: this.renderButtons(),
        processing: true,
        serverSide: true,
        paging: true,
        columnDefs,
        lengthMenu: [
          [10, 25, 50, 100],
          [10, 25, 50, 100]
        ],
        pageLength: 50,
        ajax: this.ajax,
        columns: columnsFetched,
        language: {
          url:
            "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Portuguese-Brasil.json"
        }
      })
    }

    if (tableRef) {
      tableRef(this.table)
    }

    this.table.on("draw", () => {
      $(
        `div.dataTables_filter input[aria-controls="${this.getTableId()}"]`
      ).removeClass("input-sm")

      $(`.btn-registro[aria-controls="${this.getTableId()}"]`).on(
        "click",
        event => {
          if (onAddPress) {
            onAddPress()
          }
        }
      )

      $(`.btn-datatable[aria-controls="${this.getTableId()}"]`).on(
        "click",
        event => {
          this.handleOnClick(event.currentTarget.id)
        }
      )
    })
  }

  renderDom() {
    const { hideBoxSearch, hidePagingInfo } = this.props
    let dom = ""

    if (!hideBoxSearch) {
      dom += `<'row'<'col-md-4'B><'col-md-4 filtered-items'><'col-md-4'f>>`
    }

    dom += "<'row'<'col-md-12't>>"

    if (!hidePagingInfo) {
      dom +=
        "<'row'<'col-md-12'l>>" +
        "<'row'<'col-md-12 v-center'<i><'col-md-12'p>>>"
    }

    return dom
  }

  renderButtons() {
    const { hideAddButton, hideExportButton } = this.props
    const columns = hideExportButton
      ? []
      : [
          {
            extend: "csv",
            text: "<i class='fa fa-file-text-o'></i> CSV",
            className: "btn-space btn-default"
          },
          {
            extend: "pdf",
            text: "<i class='fa fa-file-pdf-o'></i> PDF",
            className: "btn-space btn-default"
          }
        ]

    if (hideAddButton) {
      return columns
    } else {
      return columns.concat({
        text: "<i class='fa fa-plus'></i> Novo Registro",
        className: "btn-space btn-success btn-registro"
      })
    }
  }

  renderRef = ref => {
    this.tableRef = ref
  }

  render() {
    return (
      <table
        ref={this.renderRef}
        style={{ width: "100%" }}
        className="table table-bordered table-striped"
      ></table>
    )
  }
}

export default Datatable
