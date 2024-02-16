---
---

{% assign PARTY = site.data.party %}

{% for item in PARTY %}
<h2>{{ item.label }}</h2>
{% for name in item.name %}
<h2 class='name'>{{ name }}</h2>
{%- if forloop.index != forloop.length %}<br/>{%- endif %}
{%- endfor %}
{%- endfor %}
