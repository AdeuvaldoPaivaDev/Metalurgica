export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          bairro: string;
          cidade: string;
          cpf_cnpj: string;
          created_at: string;
          endereco: string;
          estado: string;
          id: string;
          nome: string;
          numero: string;
          observacoes: string;
          owner_id: string;
          rg_ie: string;
          telefone: string;
          updated_at: string;
        };
        Insert: {
          bairro?: string;
          cidade?: string;
          cpf_cnpj?: string;
          created_at?: string;
          endereco?: string;
          estado?: string;
          id?: string;
          nome: string;
          numero?: string;
          observacoes?: string;
          owner_id?: string;
          rg_ie?: string;
          telefone?: string;
          updated_at?: string;
        };
        Update: {
          bairro?: string;
          cidade?: string;
          cpf_cnpj?: string;
          created_at?: string;
          endereco?: string;
          estado?: string;
          id?: string;
          nome?: string;
          numero?: string;
          observacoes?: string;
          owner_id?: string;
          rg_ie?: string;
          telefone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      empresas: {
        Row: {
          bairro: string;
          cep: string;
          cidade: string;
          cnpj: string;
          created_at: string;
          endereco: string;
          estado: string;
          id: string;
          inscricao_estadual: string;
          logo: string;
          nome_fantasia: string;
          numero: string;
          observacao_padrao: string;
          owner_id: string;
          razao_social: string;
          telefone: string;
          updated_at: string;
          vendedor: string;
          whatsapp: string;
        };
        Insert: {
          bairro?: string;
          cep?: string;
          cidade?: string;
          cnpj?: string;
          created_at?: string;
          endereco?: string;
          estado?: string;
          id?: string;
          inscricao_estadual?: string;
          logo?: string;
          nome_fantasia?: string;
          numero?: string;
          observacao_padrao?: string;
          owner_id?: string;
          razao_social?: string;
          telefone?: string;
          updated_at?: string;
          vendedor?: string;
          whatsapp?: string;
        };
        Update: {
          bairro?: string;
          cep?: string;
          cidade?: string;
          cnpj?: string;
          created_at?: string;
          endereco?: string;
          estado?: string;
          id?: string;
          inscricao_estadual?: string;
          logo?: string;
          nome_fantasia?: string;
          numero?: string;
          observacao_padrao?: string;
          owner_id?: string;
          razao_social?: string;
          telefone?: string;
          updated_at?: string;
          vendedor?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      ordem_servico_itens: {
        Row: {
          codigo: string;
          created_at: string;
          descricao: string;
          id: string;
          ordem_servico_id: string;
          owner_id: string;
          produto_id: string | null;
          quantidade: number;
          unidade: string;
          valor_total: number;
          valor_unitario: number;
        };
        Insert: {
          codigo?: string;
          created_at?: string;
          descricao?: string;
          id?: string;
          ordem_servico_id: string;
          owner_id?: string;
          produto_id?: string | null;
          quantidade?: number;
          unidade?: string;
          valor_total?: number;
          valor_unitario?: number;
        };
        Update: {
          codigo?: string;
          created_at?: string;
          descricao?: string;
          id?: string;
          ordem_servico_id?: string;
          owner_id?: string;
          produto_id?: string | null;
          quantidade?: number;
          unidade?: string;
          valor_total?: number;
          valor_unitario?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ordem_servico_itens_ordem_servico_id_fkey";
            columns: ["ordem_servico_id"];
            isOneToOne: false;
            referencedRelation: "ordens_servico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordem_servico_itens_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
      ordens_servico: {
        Row: {
          acrescimo: number;
          cliente_id: string | null;
          cliente_nome: string;
          created_at: string;
          data_emissao: string;
          desconto: number;
          id: string;
          numero: string;
          observacoes: string;
          owner_id: string;
          subtotal: number;
          total: number;
          updated_at: string;
          vendedor: string;
        };
        Insert: {
          acrescimo?: number;
          cliente_id?: string | null;
          cliente_nome?: string;
          created_at?: string;
          data_emissao?: string;
          desconto?: number;
          id?: string;
          numero: string;
          observacoes?: string;
          owner_id?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          vendedor?: string;
        };
        Update: {
          acrescimo?: number;
          cliente_id?: string | null;
          cliente_nome?: string;
          created_at?: string;
          data_emissao?: string;
          desconto?: number;
          id?: string;
          numero?: string;
          observacoes?: string;
          owner_id?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          vendedor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      produtos: {
        Row: {
          codigo: string;
          created_at: string;
          descricao: string;
          id: string;
          owner_id: string;
          unidade: string;
          updated_at: string;
          valor_unitario: number;
        };
        Insert: {
          codigo: string;
          created_at?: string;
          descricao: string;
          id?: string;
          owner_id?: string;
          unidade?: string;
          updated_at?: string;
          valor_unitario?: number;
        };
        Update: {
          codigo?: string;
          created_at?: string;
          descricao?: string;
          id?: string;
          owner_id?: string;
          unidade?: string;
          updated_at?: string;
          valor_unitario?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_ordem_servico: {
        Args: {
          p_acrescimo: number;
          p_cliente_id: string | null;
          p_cliente_nome: string;
          p_desconto: number;
          p_itens: Json;
          p_observacoes: string;
          p_ordem_id: string | null;
          p_subtotal: number;
          p_total: number;
          p_vendedor: string;
        };
        Returns: {
          id: string;
          numero: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
