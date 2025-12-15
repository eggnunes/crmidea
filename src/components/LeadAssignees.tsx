import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, UserPlus, X, Users } from "lucide-react";
import { useLeadAssignees } from "@/hooks/useLeadAssignees";

interface LeadAssigneesProps {
  leadId: string;
  compact?: boolean;
}

export function LeadAssignees({ leadId, compact = false }: LeadAssigneesProps) {
  const { assignees, availableUsers, loading, assignUser, removeAssignee } = useLeadAssignees(leadId);
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />;
  }

  const unassignedUsers = availableUsers.filter(
    (user) => !assignees.find((a) => a.user_id === user.id)
  );

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <Users className="w-4 h-4" />
            {assignees.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {assignees.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responsáveis</DialogTitle>
            <DialogDescription>
              Atribua responsáveis para este lead
            </DialogDescription>
          </DialogHeader>
          <AssigneeContent
            assignees={assignees}
            unassignedUsers={unassignedUsers}
            onAssign={assignUser}
            onRemove={removeAssignee}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Responsáveis</label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Atribuir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Responsável</DialogTitle>
              <DialogDescription>
                Selecione um ou mais usuários para atribuir como responsáveis
              </DialogDescription>
            </DialogHeader>
            <Command>
              <CommandInput placeholder="Buscar usuário..." />
              <CommandList>
                <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                <CommandGroup>
                  {unassignedUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => {
                        assignUser(user.id);
                      }}
                    >
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {user.email}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>

      {assignees.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum responsável atribuído</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignees.map((assignee) => (
            <Badge
              key={assignee.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <Avatar className="w-4 h-4">
                <AvatarFallback className="text-[10px]">
                  {assignee.user_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{assignee.user_name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => removeAssignee(assignee.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function AssigneeContent({
  assignees,
  unassignedUsers,
  onAssign,
  onRemove,
}: {
  assignees: any[];
  unassignedUsers: any[];
  onAssign: (userId: string) => void;
  onRemove: (assigneeId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {assignees.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Responsáveis atuais</label>
          <div className="flex flex-wrap gap-2">
            {assignees.map((assignee) => (
              <Badge
                key={assignee.id}
                variant="secondary"
                className="flex items-center gap-2 pr-1"
              >
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-xs">
                    {assignee.user_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span>{assignee.user_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-destructive/20"
                  onClick={() => onRemove(assignee.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Adicionar responsável</label>
        <Command className="border rounded-md">
          <CommandInput placeholder="Buscar usuário..." />
          <CommandList>
            <CommandEmpty>Nenhum usuário disponível.</CommandEmpty>
            <CommandGroup>
              {unassignedUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => onAssign(user.id)}
                  className="cursor-pointer"
                >
                  <Avatar className="w-6 h-6 mr-2">
                    <AvatarFallback className="text-xs">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span>{user.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {user.email}
                    </span>
                  </div>
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
