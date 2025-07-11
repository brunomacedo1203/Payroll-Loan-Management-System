import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClienteService, ServiceResponse, Cliente } from '../cliente.service';
import { ClienteDetalhesComponent } from '../cliente-detalhes/cliente-detalhes.component';
import { ConfirmarInativacaoDialogComponent } from '../confirmar-inativacao-dialog.component';
import { ConfirmarExclusaoDialogComponent } from '../confirmar-exclusao-dialog.component';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-cliente-list',
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class ClienteListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nome', 'cpf', 'email', 'ativo', 'acoes'];
  dataSource: MatTableDataSource<Cliente> = new MatTableDataSource<Cliente>([]);
  isLoading = true;
  isAdmin = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) {
    const user = this.authService.currentUserValue;
    this.isAdmin = user?.cargo === 'Administrador';
  }

  ngOnInit() {
    this.carregarClientes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  carregarClientes() {
    this.isLoading = true;
    this.clienteService.getClientes().subscribe({
      next: (response: ServiceResponse<Cliente[]>) => {
        if (response?.dados) {
          this.dataSource.data = response.dados;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.isLoading = false;
      }
    });
  }

  verDetalhes(cliente: Cliente) {
    this.dialog.open(ClienteDetalhesComponent, {
      width: '600px',
      data: cliente
    });
  }

  editarCliente(cliente: Cliente): void {
    this.router.navigate(['/clientes/editar', cliente.id]);
  }

  novoCliente(): void {
    this.router.navigate(['/clientes/novo']);
  }

  inativarCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ConfirmarInativacaoDialogComponent, {
      width: '350px',
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.clienteService.inativarCliente(cliente.id).subscribe({
          next: (response) => {
            if (response?.sucesso) {
              this.carregarClientes();
            } else {
              console.error('Erro ao inativar cliente:', response?.mensagem);
            }
          },
          error: (error) => {
            console.error('Erro ao inativar cliente:', error);
          }
        });
      }
    });
  }

  excluirCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ConfirmarExclusaoDialogComponent, {
      width: '350px',
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.clienteService.excluirCliente(cliente.id).subscribe({
          next: (response) => {
            if (response?.sucesso) {
              this.carregarClientes();
              this.router.navigate(['/clientes']);
            } else {
              console.error('Erro ao excluir cliente:', response?.mensagem);
            }
          },
          error: (error) => {
            console.error('Erro ao excluir cliente:', error);
          }
        });
      }
    });
  }

  mostrarSemPermissao() {
    alert('Você não tem permissão para realizar esta ação.');
  }

  exportarExcel() {
    this.clienteService.exportarExcel().subscribe({
      next: (blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'clientes.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      },
      error: (error) => {
        console.error('Erro ao exportar clientes:', error);
        alert('Erro ao exportar clientes para Excel.');
      }
    });
  }
}
