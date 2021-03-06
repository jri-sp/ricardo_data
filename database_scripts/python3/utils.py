import re
import os
from unidecode import unidecode

# source slug generation
nonLetters = re.compile(r'\W', re.UNICODE)
source_fields_slug = lambda source : ['editor' if source['source_category'] == 'website' else 'author','name', 'country', 'volume_date', 'volume_number', 'pages']
source_fields_filename = lambda source : ['editor' if source['source_category'] == 'website' else 'author', 'name', 'country', 'volume_date', 'volume_number']    

def _generic_source_slugify(source, fields):
    slug = lambda s : ''.join([re.sub(nonLetters,'',w).capitalize() for w in s.split(' ')])
    return '_'.join(slug(source[f]) for f in fields if f in source and source[f] and slug(source[f]))

def source_slugify(source):
    return _generic_source_slugify(source, source_fields_slug(source))

def source_filename(source):
    return unidecode(_generic_source_slugify(source, source_fields_filename(source)))

def source_label(source, with_pages=True):
    fields = source_fields_slug(source) if not with_pages else source_fields_slug(source) + ['pages']
    return ', '.join([source[f] for f in (source_fields_slug(source)) if f in source and source[f] and source[f] != ''])


def join_flows(data_dir = '../../data'):
    with open(os.path.join(data_dir, 'flows.csv'), 'w', encoding='utf8') as flow_one_f:
        headers_wrote = False
        for path, dirs, flow_files in os.walk(os.path.join(data_dir, 'flows')):
            for flow_file in flow_files:
                with open(os.path.join(path,flow_file), 'r', encoding='utf8') as f:
                    if headers_wrote:
                        # remove headers
                        f.readline()
                    flow_one_f.write(f.read())
                    headers_wrote = True
