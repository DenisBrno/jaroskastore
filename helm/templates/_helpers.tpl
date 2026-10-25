{{- define "jaroskastore.name" -}}
jaroskastore
{{- end }}

{{- define "jaroskastore.fullname" -}}
{{ .Release.Name }}
{{- end }}

{{- define "jaroskastore.labels" -}}
app.kubernetes.io/name: {{ include "jaroskastore.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
