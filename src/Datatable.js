import "./Datatable.scoped.css"
import "datatables.net-buttons-bs"
import "datatables.net-buttons/js/buttons.html5.js"
import "jszip"
import "pdfmake"

import React from "react"
import PropTypes from "prop-types"

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
    $.extend($.fn.dataTableExt.oSort, {
      "date-uk-pre": function(a) {
        if (a == null || a == "") {
          return 0
        }
        var ukDatea = a.split("/")
        return (ukDatea[2] + ukDatea[1] + ukDatea[0]) * 1
      },

      "date-uk-asc": function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0
      },

      "date-uk-desc": function(a, b) {
        return a < b ? 1 : a > b ? -1 : 0
      }
    })

    await this.drawTable()
  }

  async componentDidUpdate(prevProps) {
    const { id, serverDisabled = false, columns, data } = this.props

    if (serverDisabled) {
      if (JSON.stringify(prevProps.columns) != JSON.stringify(columns)) {
        if (this.table) {
          await this.table.clear().destroy()
        }
        this.drawTable()
      } else {
        if (JSON.stringify(prevProps.data) != JSON.stringify(data)) {
          this.addRows(data)
        }
      }
    } else {
      if (id != prevProps.id) {
        if (this.table && !serverDisabled) {
          this.table.ajax.reload()
        }
      }
    }
  }

  async componentWillUnmount() {
    if (this.table) {
      await this.table.destroy(true)
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
    const {
      onEditPress,
      editableRow = false,
      onDeletePress,
      columnButtons
    } = this.props
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

      default:
        if (columnButtons != null) {
          const operationKeys = Object.keys(columnButtons)
          if (operationKeys.includes(operation)) {
            this.table.rows().every((index, element) => {
              const row = this.table.rows().data()[index]
              if (row.key == id) {
                columnButtons[operation](row)
              }
            })
          }
        }
    }
  }

  ajax = async (data, callback) => {
    const {
      fetchUrl,
      proxy,
      id,
      idRequired = false,
      serverDisabled = false
    } = this.props

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
        `${proxy || ""}datatable/${fetchUrl}?${id ? `id=${id}&` : ""}start=${
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

  addRows = arr => {
    if (arr) {
      const formattedArr = arr.map(item => {
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
      this.table.clear()
      this.table.rows.add(formattedArr).draw(false)
      return formattedArr
    }
  }

  drawTable = async () => {
    const {
      tableRef,
      fetchUrl,
      proxy,
      onAddPress,
      serverDisabled = false,
      columns,
      columnDefs,
      data
    } = this.props

    if (serverDisabled) {
      if (columns != null && columns.length > 0) {
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
        this.table = $(this.tableRef).DataTable({
          dom: this.renderDom(),
          buttons: this.renderButtons(),
          columnDefs,
          paging: false,
          columns: [{ title: "", data: "empty" }],
          language: {
            url:
              "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Portuguese-Brasil.json"
          }
        })
      }
      this.addRows(data)
    } else {
      const columnsFetch = await fetch(
        `${proxy || ""}datatable/${fetchUrl}/colunas`
      )
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

    if (tableRef) {
      tableRef({
        ...this.table,
        ...{
          addRows: this.addRows
        }
      })
    }
  }

  renderDom() {
    const { hideBoxSearch = false, hidePagingInfo = false } = this.props
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
    const { hideAddButton = false, exportOptions } = this.props
    const columns = []

    if (exportOptions != null && exportOptions.length > 0) {
      for (let i = 0; i < exportOptions.length; i++) {
        switch (exportOptions[i]) {
          case "csv":
            columns.push({
              extend: "csv",
              text: "<i class='fa fa-file-text-o'></i> CSV",
              className: "btn-space btn-default"
            })
            break
          case "pdf":
            columns.push({
              extend: "pdf",
              text: "<i class='fa fa-file-pdf-o'></i> PDF",
              className: "btn-space btn-default"
            })
            break
        }
      }
    }

    if (!hideAddButton) {
      columns.push({
        text: "<i class='fa fa-plus'></i> Novo Registro",
        className: "btn-space btn-success btn-registro"
      })
    }

    return columns
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

Datatable.propTypes = {
  fetchUrl: PropTypes.string,
  id: PropTypes.string,
  idRequired: PropTypes.bool,
  onAddPress: PropTypes.func,
  onEditPress: PropTypes.func,
  onDeletePress: PropTypes.func,
  hideAddButton: PropTypes.bool,
  exportOptions: PropTypes.array,
  tableRef: PropTypes.func,
  editableRow: PropTypes.bool,
  serverDisabled: PropTypes.bool,
  columns: PropTypes.array,
  columnDefs: PropTypes.object,
  hideBoxSearch: PropTypes.bool,
  hidePagingInfo: PropTypes.bool,
  data: PropTypes.array,
  proxy: PropTypes.string
}

export default Datatable
