import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, ShieldCheck, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AppRole = 'admin' | 'moderator' | 'user';

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuário'
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderator: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  user: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, users, loading, fetchUsers, assignRole, removeRole } = useUserRoles();
  const { toast } = useToast();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === user?.id && newRole !== 'admin') {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode remover seu próprio acesso de administrador.',
        variant: 'destructive'
      });
      return;
    }

    setUpdatingUser(userId);
    
    if (newRole === 'none') {
      const { error } = await removeRole(userId);
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover o papel do usuário.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Papel removido',
          description: 'O papel do usuário foi removido com sucesso.'
        });
      }
    } else {
      const { error } = await assignRole(userId, newRole as AppRole);
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o papel do usuário.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Papel atualizado',
          description: `Usuário agora é ${roleLabels[newRole as AppRole]}.`
        });
      }
    }
    
    setUpdatingUser(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários e suas permissões no sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <User className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.user_id}>
                  <TableCell className="font-medium">
                    {userItem.name || 'Sem nome'}
                    {userItem.user_id === user?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                    )}
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    {userItem.role ? (
                      <Badge className={roleColors[userItem.role]}>
                        {roleLabels[userItem.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sem papel
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(userItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={userItem.role || 'none'}
                      onValueChange={(value) => handleRoleChange(userItem.user_id, value)}
                      disabled={updatingUser === userItem.user_id}
                    >
                      <SelectTrigger className="w-[140px]">
                        {updatingUser === userItem.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem papel</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
