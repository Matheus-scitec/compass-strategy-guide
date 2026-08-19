export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      acao: {
        Row: {
          created_at: string
          id: string
          iniciativa_id: string
          prazo: string | null
          procedencia: Database["public"]["Enums"]["procedencia"]
          responsavel_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          iniciativa_id: string
          prazo?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          responsavel_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          iniciativa_id?: string
          prazo?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          responsavel_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acao_iniciativa_id_fkey"
            columns: ["iniciativa_id"]
            isOneToOne: false
            referencedRelation: "iniciativa"
            referencedColumns: ["id"]
          },
        ]
      }
      apuracao: {
        Row: {
          classificacao_numero: Database["public"]["Enums"]["classificacao_numero"]
          created_at: string
          fechado: boolean
          id: string
          indicador_id: string
          observacao: string | null
          periodo: string
          procedencia: Database["public"]["Enums"]["procedencia"]
          reapresentado: boolean
          valor: number | null
        }
        Insert: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          created_at?: string
          fechado?: boolean
          id?: string
          indicador_id: string
          observacao?: string | null
          periodo: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          reapresentado?: boolean
          valor?: number | null
        }
        Update: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          created_at?: string
          fechado?: boolean
          id?: string
          indicador_id?: string
          observacao?: string | null
          periodo?: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          reapresentado?: boolean
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apuracao_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "indicador"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclo: {
        Row: {
          created_at: string
          criado_por: string
          etapa_atual: number
          horizonte_fim: string
          horizonte_inicio: string
          id: string
          nome: string
          org_id: string
          procedencia: Database["public"]["Enums"]["procedencia"]
          status: Database["public"]["Enums"]["status_ciclo"]
          tipo: Database["public"]["Enums"]["tipo_ciclo"]
        }
        Insert: {
          created_at?: string
          criado_por?: string
          etapa_atual?: number
          horizonte_fim: string
          horizonte_inicio: string
          id?: string
          nome: string
          org_id: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          status?: Database["public"]["Enums"]["status_ciclo"]
          tipo?: Database["public"]["Enums"]["tipo_ciclo"]
        }
        Update: {
          created_at?: string
          criado_por?: string
          etapa_atual?: number
          horizonte_fim?: string
          horizonte_inicio?: string
          id?: string
          nome?: string
          org_id?: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          status?: Database["public"]["Enums"]["status_ciclo"]
          tipo?: Database["public"]["Enums"]["tipo_ciclo"]
        }
        Relationships: [
          {
            foreignKeyName: "ciclo_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario: {
        Row: {
          autor: string
          created_at: string
          entidade_id: string
          entidade_tipo: string
          id: string
          mencoes: string[]
          org_id: string
          resolvido: boolean
          texto: string
        }
        Insert: {
          autor?: string
          created_at?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          mencoes?: string[]
          org_id: string
          resolvido?: boolean
          texto: string
        }
        Update: {
          autor?: string
          created_at?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          mencoes?: string[]
          org_id?: string
          resolvido?: boolean
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      decisao: {
        Row: {
          acao_id: string | null
          autor: string
          created_at: string
          id: string
          prazo: string | null
          procedencia: Database["public"]["Enums"]["procedencia"]
          responsavel_id: string | null
          reuniao_id: string
          status: string
          texto: string
        }
        Insert: {
          acao_id?: string | null
          autor?: string
          created_at?: string
          id?: string
          prazo?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          responsavel_id?: string | null
          reuniao_id: string
          status?: string
          texto: string
        }
        Update: {
          acao_id?: string | null
          autor?: string
          created_at?: string
          id?: string
          prazo?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          responsavel_id?: string | null
          reuniao_id?: string
          status?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisao_acao_id_fkey"
            columns: ["acao_id"]
            isOneToOne: false
            referencedRelation: "acao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisao_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reuniao_revisao"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico: {
        Row: {
          bloco: string
          ciclo_id: string
          conteudo: string | null
          created_at: string
          id: string
          lacunas: string[]
          procedencia: Database["public"]["Enums"]["procedencia"]
        }
        Insert: {
          bloco: string
          ciclo_id: string
          conteudo?: string | null
          created_at?: string
          id?: string
          lacunas?: string[]
          procedencia?: Database["public"]["Enums"]["procedencia"]
        }
        Update: {
          bloco?: string
          ciclo_id?: string
          conteudo?: string | null
          created_at?: string
          id?: string
          lacunas?: string[]
          procedencia?: Database["public"]["Enums"]["procedencia"]
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
        ]
      }
      escolha: {
        Row: {
          ciclo_id: string
          created_at: string
          id: string
          procedencia: Database["public"]["Enums"]["procedencia"]
          quadrante_matriz: string | null
          texto: string
          tipo: Database["public"]["Enums"]["tipo_escolha"]
        }
        Insert: {
          ciclo_id: string
          created_at?: string
          id?: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          quadrante_matriz?: string | null
          texto: string
          tipo: Database["public"]["Enums"]["tipo_escolha"]
        }
        Update: {
          ciclo_id?: string
          created_at?: string
          id?: string
          procedencia?: Database["public"]["Enums"]["procedencia"]
          quadrante_matriz?: string | null
          texto?: string
          tipo?: Database["public"]["Enums"]["tipo_escolha"]
        }
        Relationships: [
          {
            foreignKeyName: "escolha_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
        ]
      }
      etapa_ciclo: {
        Row: {
          aceite_capacidade: string | null
          ciclo_id: string
          fechada_em: string | null
          fechada_por: string | null
          id: string
          nome: string
          numero: number
          status: Database["public"]["Enums"]["status_etapa"]
        }
        Insert: {
          aceite_capacidade?: string | null
          ciclo_id: string
          fechada_em?: string | null
          fechada_por?: string | null
          id?: string
          nome: string
          numero: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Update: {
          aceite_capacidade?: string | null
          ciclo_id?: string
          fechada_em?: string | null
          fechada_por?: string | null
          id?: string
          nome?: string
          numero?: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Relationships: [
          {
            foreignKeyName: "etapa_ciclo_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
        ]
      }
      indicador: {
        Row: {
          classificacao_numero: Database["public"]["Enums"]["classificacao_numero"]
          codigo: string
          created_at: string
          fonte: string | null
          formula: string | null
          frequencia: string | null
          id: string
          linha_base: number | null
          linha_base_data: string | null
          nome: string
          objetivo_id: string
          polaridade: Database["public"]["Enums"]["polaridade"] | null
          procedencia: Database["public"]["Enums"]["procedencia"]
          publicado: boolean
          responsavel_apuracao: string | null
          tipo_indicador: string
          unidade: string | null
        }
        Insert: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          codigo: string
          created_at?: string
          fonte?: string | null
          formula?: string | null
          frequencia?: string | null
          id?: string
          linha_base?: number | null
          linha_base_data?: string | null
          nome: string
          objetivo_id: string
          polaridade?: Database["public"]["Enums"]["polaridade"] | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          publicado?: boolean
          responsavel_apuracao?: string | null
          tipo_indicador?: string
          unidade?: string | null
        }
        Update: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          codigo?: string
          created_at?: string
          fonte?: string | null
          formula?: string | null
          frequencia?: string | null
          id?: string
          linha_base?: number | null
          linha_base_data?: string | null
          nome?: string
          objetivo_id?: string
          polaridade?: Database["public"]["Enums"]["polaridade"] | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          publicado?: boolean
          responsavel_apuracao?: string | null
          tipo_indicador?: string
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicador_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivo"
            referencedColumns: ["id"]
          },
        ]
      }
      iniciativa: {
        Row: {
          ciclo_id: string
          classificacao_numero: Database["public"]["Enums"]["classificacao_numero"]
          codigo: string
          created_at: string
          entregavel_verificavel: string | null
          fim: string | null
          id: string
          inicio: string | null
          investimento: number | null
          lider_id: string | null
          objetivo_id: string | null
          procedencia: Database["public"]["Enums"]["procedencia"]
          publicado: boolean
          reversibilidade: string | null
          status: Database["public"]["Enums"]["status_iniciativa"]
          titulo: string
        }
        Insert: {
          ciclo_id: string
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          codigo: string
          created_at?: string
          entregavel_verificavel?: string | null
          fim?: string | null
          id?: string
          inicio?: string | null
          investimento?: number | null
          lider_id?: string | null
          objetivo_id?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          publicado?: boolean
          reversibilidade?: string | null
          status?: Database["public"]["Enums"]["status_iniciativa"]
          titulo: string
        }
        Update: {
          ciclo_id?: string
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          codigo?: string
          created_at?: string
          entregavel_verificavel?: string | null
          fim?: string | null
          id?: string
          inicio?: string | null
          investimento?: number | null
          lider_id?: string | null
          objetivo_id?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          publicado?: boolean
          reversibilidade?: string | null
          status?: Database["public"]["Enums"]["status_iniciativa"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "iniciativa_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iniciativa_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivo"
            referencedColumns: ["id"]
          },
        ]
      }
      membro_organizacao: {
        Row: {
          created_at: string
          id: string
          org_id: string
          papel: Database["public"]["Enums"]["papel_org"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          papel?: Database["public"]["Enums"]["papel_org"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          papel?: Database["public"]["Enums"]["papel_org"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membro_organizacao_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_indicador: {
        Row: {
          classificacao_numero: Database["public"]["Enums"]["classificacao_numero"]
          created_at: string
          id: string
          indicador_id: string
          periodo: string
          valor: number
        }
        Insert: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          created_at?: string
          id?: string
          indicador_id: string
          periodo: string
          valor: number
        }
        Update: {
          classificacao_numero?: Database["public"]["Enums"]["classificacao_numero"]
          created_at?: string
          id?: string
          indicador_id?: string
          periodo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "meta_indicador_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "indicador"
            referencedColumns: ["id"]
          },
        ]
      }
      objetivo: {
        Row: {
          ciclo_id: string
          codigo: string
          created_at: string
          dono_id: string | null
          forum_acompanhamento: string | null
          frase: string
          id: string
          ordem: number
          perspectiva: Database["public"]["Enums"]["perspectiva"]
          por_que_importa: string | null
          procedencia: Database["public"]["Enums"]["procedencia"]
          risco_principal: string | null
        }
        Insert: {
          ciclo_id: string
          codigo: string
          created_at?: string
          dono_id?: string | null
          forum_acompanhamento?: string | null
          frase: string
          id?: string
          ordem?: number
          perspectiva: Database["public"]["Enums"]["perspectiva"]
          por_que_importa?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          risco_principal?: string | null
        }
        Update: {
          ciclo_id?: string
          codigo?: string
          created_at?: string
          dono_id?: string | null
          forum_acompanhamento?: string | null
          frase?: string
          id?: string
          ordem?: number
          perspectiva?: Database["public"]["Enums"]["perspectiva"]
          por_que_importa?: string | null
          procedencia?: Database["public"]["Enums"]["procedencia"]
          risco_principal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objetivo_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacao: {
        Row: {
          created_at: string
          criado_por: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          criado_por?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      perfil: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      reapresentacao: {
        Row: {
          apuracao_id: string
          autor: string
          data: string
          id: string
          motivo: string
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          apuracao_id: string
          autor?: string
          data?: string
          id?: string
          motivo: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          apuracao_id?: string
          autor?: string
          data?: string
          id?: string
          motivo?: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reapresentacao_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracao"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_revisao: {
        Row: {
          ciclo_id: string
          concluida_em: string | null
          concluida_por: string | null
          created_at: string
          data: string
          id: string
          observacoes: string | null
          periodo: string
          status: string
        }
        Insert: {
          ciclo_id: string
          concluida_em?: string | null
          concluida_por?: string | null
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          periodo: string
          status?: string
        }
        Update: {
          ciclo_id?: string
          concluida_em?: string | null
          concluida_por?: string | null
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          periodo?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_revisao_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
        ]
      }
      revisao_meta: {
        Row: {
          autor: string
          data: string
          id: string
          indicador_id: string
          motivo: string
          periodo: string
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          autor?: string
          data?: string
          id?: string
          indicador_id: string
          motivo: string
          periodo: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          autor?: string
          data?: string
          id?: string
          indicador_id?: string
          motivo?: string
          periodo?: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revisao_meta_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "indicador"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      e_membro: { Args: { _org: string }; Returns: boolean }
      org_da_iniciativa: { Args: { _ini: string }; Returns: string }
      org_da_reuniao: { Args: { _reuniao: string }; Returns: string }
      org_do_ciclo: { Args: { _ciclo: string }; Returns: string }
      org_do_indicador: { Args: { _ind: string }; Returns: string }
      org_do_objetivo: { Args: { _obj: string }; Returns: string }
      pode_editar: { Args: { _org: string }; Returns: boolean }
      reapresentar_apuracao: {
        Args: { _apuracao: string; _motivo: string; _valor_novo: number }
        Returns: {
          classificacao_numero: Database["public"]["Enums"]["classificacao_numero"]
          created_at: string
          fechado: boolean
          id: string
          indicador_id: string
          observacao: string | null
          periodo: string
          procedencia: Database["public"]["Enums"]["procedencia"]
          reapresentado: boolean
          valor: number | null
        }
        SetofOptions: {
          from: "*"
          to: "apuracao"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tem_papel: {
        Args: { _org: string; _papel: Database["public"]["Enums"]["papel_org"] }
        Returns: boolean
      }
    }
    Enums: {
      classificacao_numero:
        | "dado_medido"
        | "premissa_da_diretoria"
        | "estimativa"
      papel_org: "facilitador" | "executivo" | "conselheiro"
      perspectiva:
        | "financeiro"
        | "cliente_mercado"
        | "processos_internos"
        | "aprendizado_crescimento"
        | "sustentacao"
      polaridade: "maior" | "menor"
      procedencia:
        | "decidido_pelo_time"
        | "importado_de_documento"
        | "sugerido_pelo_sistema"
        | "inferido"
      status_ciclo: "rascunho" | "ativo" | "encerrado"
      status_etapa: "nao_iniciada" | "em_andamento" | "fechada"
      status_iniciativa: "N" | "A" | "C" | "T"
      tipo_ciclo: "estrategico" | "tatico"
      tipo_escolha: "onde_jogar" | "como_ganhar" | "nao_faremos"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      classificacao_numero: [
        "dado_medido",
        "premissa_da_diretoria",
        "estimativa",
      ],
      papel_org: ["facilitador", "executivo", "conselheiro"],
      perspectiva: [
        "financeiro",
        "cliente_mercado",
        "processos_internos",
        "aprendizado_crescimento",
        "sustentacao",
      ],
      polaridade: ["maior", "menor"],
      procedencia: [
        "decidido_pelo_time",
        "importado_de_documento",
        "sugerido_pelo_sistema",
        "inferido",
      ],
      status_ciclo: ["rascunho", "ativo", "encerrado"],
      status_etapa: ["nao_iniciada", "em_andamento", "fechada"],
      status_iniciativa: ["N", "A", "C", "T"],
      tipo_ciclo: ["estrategico", "tatico"],
      tipo_escolha: ["onde_jogar", "como_ganhar", "nao_faremos"],
    },
  },
} as const
