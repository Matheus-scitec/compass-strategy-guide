alter table public.objetivo add constraint objetivo_dono_id_perfil_fkey foreign key (dono_id) references public.perfil(id) on delete set null;
alter table public.iniciativa add constraint iniciativa_lider_id_perfil_fkey foreign key (lider_id) references public.perfil(id) on delete set null;
alter table public.acao add constraint acao_responsavel_id_perfil_fkey foreign key (responsavel_id) references public.perfil(id) on delete set null;
alter table public.indicador add constraint indicador_responsavel_apuracao_perfil_fkey foreign key (responsavel_apuracao) references public.perfil(id) on delete set null;
alter table public.decisao add constraint decisao_responsavel_id_perfil_fkey foreign key (responsavel_id) references public.perfil(id) on delete set null;
alter table public.comentario add constraint comentario_autor_perfil_fkey foreign key (autor) references public.perfil(id) on delete cascade;
alter table public.membro_organizacao add constraint membro_organizacao_user_id_perfil_fkey foreign key (user_id) references public.perfil(id) on delete cascade;